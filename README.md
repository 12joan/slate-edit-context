# Edit Context API-based Slate Editor

This is a proof-of-concept Slate editor built using the experimental Edit Context API (currently only available in Chrome).

It uses the real `slate` and `slate-history` packages (and `slate-dom`, but only for `Hotkeys.isUndo`, etc.), in addition to a custom React-based rendering system and a mixture of Edit Context and plain DOM events for input.
