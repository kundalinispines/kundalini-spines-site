One-line: the upgraded footer — links first and findable, instrument texture beside them, the wordmark cropped by the footer's own edge.

    <SiteFooter columns={[{head:'Kundalini Spines'},{head:'Navigate',rows:[{label:'Music',href:'/#tracks'}]},{head:'Channels',rows:[{label:'TikTok'}]}]} blurb="Knowledge hidden in plain sight." />

A row without an href is not a disabled link, it is a STATEMENT ABOUT A CHANNEL: the anchor is removed entirely and the chip reads STANDBY. Never ship href="#" — it teaches the reader the site is broken rather than that the channel is not open yet. On narrow screens the link columns collapse before the instrument band does; under 640px the band goes entirely, because links are the footer's job and the band is its texture.
