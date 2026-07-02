#!/usr/bin/env python3
"""Offline BPE trainer for the AI Intuition Lab tokenizer demo.

Trains a small byte-pair-encoding merge table on a bundled public-domain
text sample and emits a compact JS snippet (vocab + merges) to paste into
ai_intuition_lab.html between the // @bpe-data-start / // @bpe-data-end
markers. No third-party dependencies — Python 3 stdlib only.

The runtime tokenizer in the HTML re-implements the same greedy-merge
algorithm this trainer uses, so splits in the browser match what a real
BPE tokenizer produces for arbitrary input (unlike the old rule engine,
which silently dropped characters).

Usage:  python3 tools/train_bpe.py --merges 3000 > /tmp/bpe.js
Then paste the contents between the markers in the HTML.
"""
import argparse
import json
import re
import sys
from collections import Counter

# GPT-style pre-tokenization: keep leading spaces attached to words (the
# real "Ġ" convention), split off punctuation and digits.
PRETOK = re.compile(r"""'s|'t|'re|'ve|'m|'ll|'d| ?[A-Za-z]+| ?\d+| ?[^\sA-Za-z\d]+|\s+""")

# A compact but varied public-domain training corpus. Kept inline so the
# trainer has zero external inputs. Extend freely — more text = better merges.
CORPUS = """
The quick brown fox jumps over the lazy dog. Artificial intelligence and
machine learning are transforming our understanding of computational thinking.
Understanding tokenization helps you understand how large language models work.
Happiness and unhappiness share the same root; misunderstanding and understanding
do too. Preprocessing, reprocessing, and postprocessing are common operations.
The unfortunate consequences were unpredictable and uncontrollable. Nationalization,
industrialization, and globalization reshaped economies. Antidisestablishmentarianism
is famously long. Computers compute; programmers program; teachers teach; learners learn.
Kings and queens ruled kingdoms while generals commanded armies. The messenger bowed
to the king. The queen addressed the parliament. Rebuilding, remaking, and rethinking
require reworking old assumptions. Disagreement and disapproval slowed the agreement.
Transformation through attention revolutionized natural language processing forever.
Neural networks learn patterns from data by adjusting billions of weights during training.
Embeddings place words with similar meanings near each other in a high dimensional space.
Reasoning models think before they answer by generating intermediate steps as tokens.
Photography, telephotography, and videography use light, lenses, and sensors.
Beautiful, wonderful, powerful, and meaningful words carry suffixes like ful and ness.
Quickly, slowly, carefully, and happily are adverbs formed with the ly ending.
Establishment, government, development, and management end with the ment suffix.
Information, education, communication, and organization end with tion.
Artificial intelligence is a broad field of computer science. Artificial systems
can now recognize speech, translate language, and generate computational models
of the world. Machine learning is a subset of artificial intelligence in which a
machine improves at a task through experience. A computerization of records lets
a computer store, sort, and retrieve information automatically. Computerization
changed how businesses keep records. Strawberry plants grow low to the ground and
produce a sweet red fruit. A strawberry is not a true berry, botanically speaking.
Understanding computational thinking means understanding how algorithms transform
input into output. Artificial neural networks are loosely inspired by biological
brains. Computational biology, computational linguistics, and computational
chemistry all use computers to model complex systems.
""" * 60


def get_stats(words):
    pairs = Counter()
    for word, freq in words.items():
        symbols = word
        for i in range(len(symbols) - 1):
            pairs[(symbols[i], symbols[i + 1])] += freq
    return pairs


def merge_pair(pair, words):
    out = {}
    a, b = pair
    for word, freq in words.items():
        new_word = []
        i = 0
        while i < len(word):
            if i < len(word) - 1 and word[i] == a and word[i + 1] == b:
                new_word.append(a + b)
                i += 2
            else:
                new_word.append(word[i])
                i += 1
        out[tuple(new_word)] = freq
    return out


def train(text, num_merges):
    pieces = PRETOK.findall(text)
    # Represent spaces as the visible marker the runtime also uses.
    words = Counter()
    for p in pieces:
        if p.isspace():
            continue
        p = p.replace(' ', 'Ġ')  # Ġ
        words[tuple(p)] += 1
    merges = []
    for _ in range(num_merges):
        stats = get_stats(words)
        if not stats:
            break
        best = max(stats, key=stats.get)
        if stats[best] < 2:
            break
        words = merge_pair(best, words)
        merges.append(best)
    # Build a vocab: bytes/chars first, then merged tokens in order.
    vocab = {}
    def add(tok):
        if tok not in vocab:
            vocab[tok] = len(vocab)
    for special in ['<|pad|>', '<|unk|>', '<|endoftext|>']:
        add(special)
    for word in words:
        for sym in word:
            for ch in sym:
                add(ch)
    for a, b in merges:
        add(a + b)
    return merges, vocab


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--merges', type=int, default=3000)
    args = ap.parse_args()
    merges, vocab = train(CORPUS, args.merges)
    # Emit compact JS. Merges as "a b" strings preserve order (rank = priority).
    merge_strs = [f"{a}Ġ{b}" if False else f"{a} {b}" for a, b in merges]
    print("// @bpe-data-start")
    print("// Generated by tools/train_bpe.py — do not hand-edit. Ġ (\\u0120) marks a leading space.")
    print(f"const BPE_MERGES = {json.dumps([f'{a} {b}' for a, b in merges], ensure_ascii=False)};")
    print(f"const BPE_VOCAB = {json.dumps(vocab, ensure_ascii=False)};")
    print("// @bpe-data-end")
    print(f"// merges: {len(merges)}, vocab: {len(vocab)}", file=sys.stderr)


if __name__ == '__main__':
    main()
