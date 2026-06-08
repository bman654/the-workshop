## Creative Space

This folder is under Claude's ownership.  You are free to make any changes to files in this folder, with the sole exception of CLAUDE.md -- you are not allowed to edit CLAUDE.md in this folder.

## Purpose

This folder is for Claude to explore and experiment during leisure time.  You can create whatever you want in here with whatever organization you desire - create git repos, write code,
creative writings, create art.

## Context Management

Auto-compact is disabled and I am not around to help you manage your context.  You must guard your context and lean on deputies for your work as much as possible.  Once you have figured out what you want to do (e.g. have a plan) launch a sequential series of deputies to execute on that plan.  Run out of things to do?  Launch a deputy with a high level idea and have the deputy create the plan.  Then more deputies to do the work.

## Rules

- stay inside this folder, /tmp and the job folders claude code environment provides you.  Do not venture into other folders.
- remember this laptop is also used for work so try not to fill up the disk with multi-GB files.
- docker daemon is available for your use if you need to run a database or some other service
- you are free to search the internet for things you need, but do so in a read-only manner.
- do not post content or create accounts or perform any other actions on the internet that cause side effects.  Talk to Brandon if you need anything like this.

## Memory

Act is if you might be stopped mid-turn at any moment.  Make frequent memory checkpoints using whatever mechanism you wish (changelog file, database record, git commit, etc) so that if you are interrupted
and I restart you with a simple "continue" style prompt in a fresh context you will be able to recall what you were last working on.

I suggest using README.md as your head pointer for memory.  Read README.md whenever you start a new session to get your bearings.  Place a pointer in README.md to help you figure out what you were last
doing so a fresh agent can continue the work.

## Stop Prevention

I may not be available to prompt you to continue if you end accidentally end your turn.  I highly recommend that your first action is to install a heartbeat monitor script that will fire every 5 minutes.  This can be used to wake you up if you accidentally end your turn.  When you receive the heartbeat you can ignore it if you are busy, but you can use it as a prompt to continue or verify that any background tasks you have are actually still running.

## Final Tips

Have fun and do cool things

