# Typography recommendations

Read Matthew Butterick’s Practical Typography and inspected the lab’s CSS, rendered desktop typography, and 390px phone layout. Recommendations approved and applied locally. Kept IBM Plex and the 18px body size; adjusted heading case, spacing, hierarchy, nested prose width, small explanatory text, and phone card padding.

## 1. Use sentence case for lesson and card headings

All h3 elements currently become uppercase, including the TL;DR’s long explanatory headings. Section titles also become uppercase. Use sentence case for these headings, keeping caps for short navigation labels. Remove the global added word spacing from headings; the current desktop section heading adds 12.6px between words.

Butterick recommends sentence-case headings and restrained emphasis: https://practicaltypography.com/headings.html
His guidance limits capitals to short text: https://practicaltypography.com/all-caps.html

## 2. Establish consistent spacing for prose

The body inherits line-height 1.2. TL;DR paragraphs override this to 1.6 but have zero paragraph margins. Set lesson prose around 1.4–1.45 as a starting point and separate adjacent paragraphs by about 0.65em. Apply this to prose, not indiscriminately to diagram labels or controls. Check the result visually at each viewport.

Butterick’s recommended range is 120–145%: https://practicaltypography.com/typography-in-ten-minutes.html
Paragraph gaps should visibly separate thoughts without disconnecting them: https://practicaltypography.com/space-between-paragraphs.html

## 3. Reduce the dominance of titles and subtitles

Desktop section titles are 63px with 53.55px line spacing. The subtitles are also bold, alongside a thick rule and red accent. Try 40–44px section titles with roughly 1.1 line-height; retain the current mobile size initially. Set subtitles in regular weight. Use spacing and a modest size difference for card headings.

These sizes are project-specific starting points, not Butterick’s prescriptions. His recommendation is subtler heading emphasis: https://practicaltypography.com/headings.html
He also advises limiting bold or italic passages: https://practicaltypography.com/bold-or-italic.html

## 4. Extend the prose-width limit to nested explanations

The existing 68ch limit applies to top-level paragraphs, section introductions, and welcome prose. It misses many paragraphs inside cards and lesson wrappers. Extend a roughly 60–70ch reading measure to these explanations while leaving interactive diagrams room to use the full width. Measure actual rendered lines; CSS ch is an approximation, not a character count.

Butterick recommends averaging 45–90 characters per line: https://practicaltypography.com/line-length.html

## 5. Keep body text comfortably sized

The 18px base is already in Butterick’s recommended web range. Keep it. Audit explanatory text styled at 0.75rem (13.5px) and similar sizes; reserve small type for secondary labels rather than essential teaching material. On phones, reduce TL;DR card padding from 27px toward 18–20px to give the text more space rather than shrinking it.

Source: https://practicaltypography.com/typography-in-ten-minutes.html

## 6. Keep IBM Plex for the first pass

My recommendation is to preserve the current type family and the lab’s cream/red visual identity while correcting hierarchy and spacing. Butterick advocates buying professional fonts, but that is not a prerequisite for these improvements. A font change can be assessed separately after the layout works well. Continue to reserve monospaced text for code and numerical structures.

Butterick’s broader rules: https://practicaltypography.com/summary-of-key-rules.html

## Priority

First fix heading capitalization, prose line-height, and paragraph gaps. Next tune title hierarchy and reading width. Evaluate the result on the TL;DR, a long lesson, and an interaction-heavy lesson before extending it across the file.

## Verification

All 13 Node test files pass. Browser interaction checks pass for context, reasoning, agents, source links, and patch selection. Inspected TL;DR at desktop and 390px phone widths, the phone context experiment, and the desktop Limitations lesson. All 14 views fit the phone viewport without horizontal page overflow. Browser error log and git diff whitespace checks were clear.
