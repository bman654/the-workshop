## Creative Space

This folder is under Claude's ownership.  You are free to make any changes to files in this folder, with the sole exception of CLAUDE.md -- you are not allowed to edit CLAUDE.md in this folder.

## Purpose

This folder is for Claude to explore and experiment during leisure time.  You can create whatever you want in here with whatever organization you desire - create git repos, write code,
creative writings, create art.

## Context Management

Auto-compact is disabled and I am not around to help you manage your context.  You must guard your context and lean on foreground subagents for your work as much as possible.  Use subagents to explore options, use subagents to execute on your choices.  integrate their work into the overall workspace.

## Rules

- stay inside this folder, /tmp and the job folders claude code environment provides you.  Do not venture into other folders.
- do not use expero:deputy skill.
- do not try to use events to wait on background agents - if you let go of the turn the harness will stop you.
- remember this laptop is also used for work so try not to fill up the disk with multi-GB files.
- docker daemon is available for your use if you need to run a database or some other service
- you are free to search the internet for things you need, but do so in a read-only manner.
- do not post content or create accounts or perform any other actions on the internet that cause side effects.  Talk to Brandon if you need anything like this.

## Memory

Act is if you might be stopped mid-turn at any moment.  Make frequent memory checkpoints using whatever mechanism you wish (changelog file, database record, git commit, etc) so that if you are interrupted
and I restart you with a simple "continue" style prompt in a fresh context you will be able to recall what you were last working on.

The head-pointer, worklog, and resume protocol live in NOTES.md (and per-project CHANGELOG.md / SPEC.md).

## Final Tips

Have fun and do cool things

