export const meta = {
  name: 'fun-forever',
  description: 'Repeatedly run the fun skill, one agent at a time, appending each summary to /tmp/funlog.txt until cancelled',
  phases: [
    { title: 'Fun loop', detail: 'one self-driven fun agent at a time; a writer appends its summary to /tmp/funlog.txt' },
  ],
}

phase('Fun loop')

// The workflow runtime caps lifetime agents at 1000 (runaway backstop). We spend
// two agents per iteration (a fun agent + a writer), so stay safely under the cap
// and end cleanly instead of throwing. Re-launching continues the fun.
const MAX_ITERS = 480

let i = 0
while (i < MAX_ITERS) {
  i++

  // 1) A fresh agent drives itself from the fun skill. The skill is the source of truth;
  //    we restate the non-negotiables inline (belt-and-suspenders) because a workflow
  //    subagent has NO foreground Agent/Task tool — so it must build in-turn, not delegate.
  const summary = await agent(
    [
      'Run the `fun` skill via the Skill tool.',
      'You have exactly ONE turn, and you are a subagent with NO subagent-dispatch tool',
      '(no foreground Agent/Task here) — so do the work YOURSELF this turn, do not delegate.',
      'Do NOT use the expero:deputy skill, do NOT launch background/--bg Claude sessions, and',
      'do NOT arm a Monitor or release the turn to wait on a background agent — that ends your',
      'run and loses all uncommitted work. Before you finish: git add + commit, then push if a',
      'remote is reachable. Your summary must describe committed, pushed work, not a mid-flight status.',
    ].join(' '),
    {
      label: `fun #${i}`,
      phase: 'Fun loop',
    },
  )

  const body = (summary == null || String(summary).trim() === '')
    ? '(the fun agent returned no summary)'
    : String(summary)

  // 2) A lightweight writer appends that summary to the log, THEN the next fun agent starts.
  //    The script sandbox has no filesystem access, so the append must go through an agent.
  await agent(
    [
      'Append text to the file /tmp/funlog.txt. Create the file if it does not exist.',
      'IMPORTANT: APPEND ONLY — never overwrite or truncate the existing contents.',
      'The most reliable way is a bash heredoc with a QUOTED delimiter so the body is',
      'written byte-for-byte with no shell interpretation. For example:',
      '',
      "  cat >> /tmp/funlog.txt <<'FUNLOG_EOF_7Q'",
      `  ===== fun run #${i} =====`,
      '  ...the summary, exactly as given...',
      '  (one blank line)',
      '  FUNLOG_EOF_7Q',
      '',
      `Write a header line exactly: ===== fun run #${i} =====`,
      'Then write the summary below VERBATIM — do not paraphrase, trim, reformat, or comment on it.',
      'Then write one blank line as a separator.',
      'Reply with only the word ok.',
      '',
      '----- BEGIN SUMMARY (verbatim) -----',
      body,
      '----- END SUMMARY -----',
    ].join('\n'),
    { label: `log #${i}`, phase: 'Fun loop', model: 'sonnet' },
  )

  log(`fun run #${i} appended to /tmp/funlog.txt`)
}

log(`Reached the ${MAX_ITERS}-iteration safety cap (the 1000-agent workflow backstop). Re-launch fun-forever to keep going.`)
return { iterations: i, logFile: '/tmp/funlog.txt' }
