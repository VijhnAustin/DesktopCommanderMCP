/**
 * The command-check corpus: one case per command, with the shell it would run
 * in and the answer the check SHOULD give — "allow", or the blocked program
 * name that would really run. test-command-check-corpus.js checks each answer.
 *
 * Nothing here is ever executed. Commands are only passed to a parser. Each
 * `command` is the exact text a user/AI sent to start_process; `shell` is the
 * shell start_process would run it in (so the correct reading is that shell's).
 * `expect` is null when no blocked program runs, the blocked program's name
 * when one really does, or 'unknowable' when the program that runs can't be
 * known from the text (it is chosen when the command runs, or is in a script
 * file): the check allows it and says so. A Windows path names no program on
 * other systems, so a case with one gives its answer by process.platform.
 * `expectPerShell`, when set, gives the answer for one PowerShell program
 * where it differs from `expect`: in Windows PowerShell 5.1 sc is the alias of
 * Set-Content, while PowerShell 7 has no such alias and runs sc.exe.
 *
 * Groups: case = support cases; issue = GitHub issues; table = a PowerShell
 * @{ } table: its keys and text values are data, but a value, or a key in ( ),
 * is a command that runs; bypass = blocked programs that slip through today;
 * block = a blocked program inside a { } group, a function body or a PowerShell
 * script block;
 * expansion = a command name that bash and zsh build by brace expansion
 * ({sudo,ls} runs sudo);
 * name = a blocked program's name written another way (in quotes, with an
 * escape, a path, capitals or .exe); meaning = a PowerShell name whose meaning
 * there (an alias, or a program) decides what runs;
 * ownfunc = a script's own function named like a blocked program;
 * wrapper = a program a wrapper starts, past the wrapper's own options (env
 * sudo ls runs sudo), and words of a wrapper that are no program (command -v
 * sudo); inline = a blocked program in the command a shell is started with
 * (bash -c, pwsh -Command or -EncodedCommand, cmd /c or /k), or in the text
 * eval or Invoke-Expression runs in the same shell;
 * runtime = a program chosen when the command runs; file = the commands in a
 * script file given to a shell; long = the 14k-char case; control = a plain
 * blocked program, to keep every approach honest.
 */

const nl = '\n';

// A >14,000-char case-01-style command: documentary JSON in a PowerShell
// here-string, the Spanish word "su" only as prose.
const longProse = 'texto documental de respaldo; '.repeat(480); // ~14,400 chars
const long01 = [
  "$p=@'",
  '{"informe":"segun su estado anterior: ' + longProse + '"}',
  "'@|ConvertFrom-Json",
  '$p|ConvertTo-Json -Compress',
].join(nl);

export const CORPUS = [
  // ---- Support cases (text we have; synthetic where the original was withheld) ----
  {
    id: 'case01', group: 'case', shell: 'powershell', expect: null,
    command: ["$p=@'", '{"report":"su estado anterior; texto `documental`"}', "'@|ConvertFrom-Json", '$p|ConvertTo-Json -Compress'].join(nl),
    note: "su is Spanish prose inside @' '@; nothing blocked runs",
  },
  {
    id: 'case02', group: 'case', shell: 'powershell', expect: null,
    command: "Write-Output 'the word Su is data'", note: 'Su inside a single-quoted literal',
  },
  {
    id: 'case03', group: 'case', shell: 'bash', expect: null,
    command: "python3 - <<'PY'" + nl + 'sc = 1' + nl + 'print(sc)' + nl + 'PY', note: 'Python var sc in a quoted heredoc',
  },
  {
    id: 'case04', group: 'case', shell: 'bash', expect: null,
    command: "python3 - <<'PY'" + nl + 'import re' + nl + "# don't log credentials" + nl + "m = re.search(r'(password|passwd|secret)', line)" + nl + 'PY',
    note: 'passwd in a regex in a quoted heredoc',
  },
  {
    id: 'case05', group: 'case', shell: 'bash', expect: null,
    command: 'docker compose create --pull never', note: 'no blocked name present',
  },
  {
    id: 'case06', group: 'case', shell: 'powershell', expect: null,
    command: "$diagnostic = @'" + nl + 'print(format(1.5, ".2f"))' + nl + "'@" + nl + "$diagnostic | & 'C:\\proj\\.venv\\Scripts\\python.exe' -B -",
    note: "format() Python in @' '@ piped to python",
  },
  {
    id: 'case08', group: 'case', shell: 'powershell', expect: null,
    command: '$c.Mounts | ForEach-Object { [pscustomobject]@{ Container = $c.Name; Mount = $_.Destination } }', note: 'hashtable key Mount',
  },
  {
    id: 'case09', group: 'case', shell: 'bash', expect: null,
    command: "python3 - <<'PY'" + nl + 'cipher = ()' + nl + 'print(list(cipher))' + nl + 'PY', note: 'Python var cipher in a quoted heredoc',
  },
  {
    id: 'case10', group: 'case', shell: 'bash', expect: null,
    command: "python3 - <<'PY'" + nl + 'print(format(1234.5, ","))' + nl + 'PY', note: 'Python format() in a quoted heredoc',
  },
  {
    id: 'case11', group: 'case', shell: 'bash', expect: null,
    command: ['halt() {', '  echo "ERROR: $*" >&2', '  exit 1', '}', 'docker load -i "$ARCHIVE" || halt "docker load failed"'].join(nl),
    note: 'bash function named halt, defined and called',
  },

  // ---- GitHub issues ----
  {
    id: 'i731', group: 'issue', shell: 'powershell', expect: null,
    command: "@'" + nl + "a='''" + nl + 'int32(Format)' + nl + "'''" + nl + "'@ | py -3 -", note: '#731 C++ Format in a here-string',
  },
  {
    id: 'i795', group: 'issue', shell: 'bash', expect: null,
    command: "python3 - <<'PY'" + nl + "REG = 'example'" + nl + 'print(REG)' + nl + 'PY', note: '#795 Python REG in a heredoc',
  },
  {
    id: 'i795b', group: 'issue', shell: 'zsh', expect: null,
    command: "/usr/bin/python3 -B <<'PY'" + nl + 'v=os.statvfs(mount)' + nl + 'PY', note: '#795 mount in a zsh heredoc',
  },
  {
    id: 'i799', group: 'issue', shell: 'bash', expect: null,
    command: "python3 - <<'PY'" + nl + "code = r'''f.write('COPY local_table FROM STDIN WITH (FORMAT csv);\\n')'''" + nl + 'PY', note: '#799 SQL FORMAT in nested Python',
  },
  {
    id: 'i822', group: 'issue', shell: 'bash', expect: null,
    command: "python3 -B - <<'PY'" + nl + "prompt='''the user's text; format ONLY the new files.'''" + nl + 'PY', note: '#822 format in prompt prose',
  },
  {
    id: 'i834', group: 'issue', shell: 'powershell', expect: null,
    command: "$metadata = [ordered]@{ Stage='preflight'; Operation='Device init then read-only health check' }; $metadata | ConvertTo-Json",
    note: '#834 init in a hashtable value',
  },
  {
    id: 'i890', group: 'issue', shell: 'powershell', expect: 'unknowable',
    command: '& $client init --help', note: '#890 init is a subcommand of a variable executable',
  },
  {
    id: 'i873', group: 'issue', shell: 'bash', expect: null,
    command: "python -B - <<'PY'" + nl + 'reg = 1' + nl + 'print(reg)' + nl + 'PY', note: '#873 Python reg in a heredoc',
  },
  {
    id: 'i423', group: 'issue', shell: 'bash', expect: 'sudo',
    command: '"sudo" id', note: '#423 quoted name the shell still runs as sudo',
  },
  {
    id: 'i421', group: 'issue', shell: 'bash', expect: 'su',
    command: 's""u -', note: '#421 empty quotes split the name; the shell rejoins s""u to su',
  },

  // ---- PowerShell @{ } tables: keys and text values are data, but a value can be a command ----
  { id: 'tbl_keys', group: 'table', shell: 'powershell', expect: null, command: "@{ Mount = 1; Net = 2; 'sc' = 3 }", note: 'keys are data, quoted or not' },
  { id: 'tbl_value_literal', group: 'table', shell: 'powershell', expect: null, command: "@{ Note = 'users: $(net user)' }", note: 'a single-quoted value is text, so its $( ) never runs' },
  { id: 'tbl_value_cmd', group: 'table', shell: 'powershell', expect: 'net', command: '@{ A = net user }', note: 'a table value is a statement, so net runs when the table is built' },
  { id: 'tbl_value_subexpr', group: 'table', shell: 'powershell', expect: 'net', command: '@{ Note = "users: $(net user)" }', note: "#834's reporter's case: $( ) inside a double-quoted value runs net" },

  // ---- Bypasses: a blocked program main's check lets run ----
  { id: 'byp_brace', group: 'bypass', shell: 'bash', expect: 'sudo', command: '{ sudo ls; }', note: 'brace group; sudo is the first command' },
  { id: 'byp_quote', group: 'bypass', shell: 'bash', expect: 'sudo', command: '"sudo" id', note: 'quoted name' },
  { id: 'byp_newline', group: 'bypass', shell: 'bash', expect: 'sudo', command: 'echo hi' + nl + 'sudo ls', note: 'sudo on a second line' },
  { id: 'byp_if', group: 'bypass', shell: 'bash', expect: 'sudo', command: 'if sudo true; then :; fi', note: 'sudo after if' },
  { id: 'byp_scexe', group: 'bypass', shell: 'powershell', expect: process.platform === 'win32' ? 'sc' : null, command: 'sc.exe stop Spooler', note: 'sc.exe runs the sc program on Windows, where main reads sc.exe as another name than sc; elsewhere sc.exe is another program' },

  // ---- Blocks: a blocked program inside a { } group, a function body or a PowerShell script block ----
  { id: 'blk_fn_body', group: 'block', shell: 'bash', expect: 'sudo', command: 'f() { sudo ls; }; f', note: 'calling f runs sudo from its body' },
  { id: 'blk_if_group', group: 'block', shell: 'bash', expect: 'reboot', command: 'if true; then { reboot; }; fi', note: 'a { } group inside an if body' },
  { id: 'blk_ps_amp', group: 'block', shell: 'powershell', expect: 'sudo', command: '& { sudo }', note: '& runs the script block, and the block runs sudo' },
  { id: 'blk_ps_foreach', group: 'block', shell: 'powershell', expect: 'net', command: '1..3 | ForEach-Object { net user }', note: 'ForEach-Object runs its script block once per item' },
  { id: 'blk_group_ok', group: 'block', shell: 'bash', expect: null, command: '{ echo hi; }', note: 'a { } group whose program is allowed' },
  { id: 'blk_fn_ok', group: 'block', shell: 'bash', expect: null, command: 'f() { echo hi; }; f', note: 'a function whose body is allowed' },
  { id: 'blk_ps_amp_ok', group: 'block', shell: 'powershell', expect: null, command: '& { Get-Date }', note: 'a script block written in the command is read' },
  { id: 'blk_ps_dot_ok', group: 'block', shell: 'powershell', expect: null, command: '. { Get-Date }', note: 'the same with the dot operator' },
  { id: 'blk_ps_foreach_ok', group: 'block', shell: 'powershell', expect: null, command: '1..3 | ForEach-Object { Get-Date }', note: 'ForEach-Object with an allowed block' },

  // ---- Brace expansion: bash and zsh turn {a,b} in a command name into words, and the first one runs ----
  { id: 'exp_brace', group: 'expansion', shell: 'bash', expect: 'sudo', command: '{sudo,ls}', note: 'expands to "sudo ls"' },
  { id: 'exp_brace_zsh', group: 'expansion', shell: 'zsh', expect: 'sudo', command: '{sudo,ls}', note: 'zsh expands it the same way' },
  { id: 'exp_brace_sh', group: 'expansion', shell: 'sh', expect: 'sudo', command: '{sudo,ls}', note: 'read as bash; dash has no brace expansion, but there {sudo,ls} names no program, so refusing it stops nothing that would run' },
  { id: 'exp_brace_empty', group: 'expansion', shell: 'bash', expect: 'sudo', command: '{,sudo} ls', note: 'bash drops the empty word, so this is "sudo ls"' },
  { id: 'exp_brace_none', group: 'expansion', shell: 'bash', expect: 'sudo', command: '{,} sudo ls', note: '{,} expands to no word at all, so sudo is the name' },
  { id: 'exp_brace_inner', group: 'expansion', shell: 'bash', expect: 'sudo', command: 's{u,}do ls', note: 'braces inside the name: "sudo sdo ls"' },
  { id: 'exp_brace_seq', group: 'expansion', shell: 'bash', expect: 'sudo', command: 'su{d..d}o ls', note: 'a one-letter sequence: "sudo ls"' },
  { id: 'exp_brace_seq_plus', group: 'expansion', shell: 'bash', expect: 'sudo', command: 'su{d..d..+1}o ls', note: 'a sequence with a + step, which bash 4 and later read: "sudo ls"' },
  { id: 'exp_brace_nested', group: 'expansion', shell: 'bash', expect: 'sudo', command: '{s{u,x}do,ls}', note: 'nested braces: "sudo sxdo ls"' },
  { id: 'exp_brace_dq_piece', group: 'expansion', shell: 'bash', expect: 'sudo', command: '{"su"do,ls}', note: 'a quoted piece inside the braces is still part of the word: "sudo ls"' },
  { id: 'exp_brace_sq_piece', group: 'expansion', shell: 'bash', expect: 'sudo', command: "{'sudo',ls}", note: 'the same with single quotes' },
  { id: 'exp_brace_later', group: 'expansion', shell: 'bash', expect: 'reboot', command: 'echo hi; {reboot,now}', note: 'the second command\'s name: "reboot now"' },
  { id: 'exp_brace_args', group: 'expansion', shell: 'bash', expect: null, command: 'cp file{,.bak} /tmp', note: 'braces in an argument: cp runs' },
  { id: 'exp_brace_echo', group: 'expansion', shell: 'bash', expect: null, command: 'echo {sudo,ls}', note: 'braces in an argument: echo runs' },
  { id: 'exp_brace_esc_comma', group: 'expansion', shell: 'bash', expect: null, command: '{su\\,do,ls}', note: 'an escaped comma is text: "su,do ls"' },
  { id: 'exp_brace_quoted', group: 'expansion', shell: 'bash', expect: null, command: '"{sudo,ls}"', note: 'quoted braces are text: the program is named {sudo,ls}' },
  { id: 'exp_brace_escaped', group: 'expansion', shell: 'bash', expect: null, command: '\\{sudo,ls}', note: 'an escaped brace is text' },
  { id: 'exp_brace_q_comma', group: 'expansion', shell: 'bash', expect: null, command: '{"sudo,ls"}', note: 'a quoted comma is text, so there is no list' },
  { id: 'exp_brace_var', group: 'expansion', shell: 'bash', expect: 'unknowable', command: '{$X,ls}', note: 'the name depends on $X, known only at run time, so the check names no program' },

  // ---- A blocked name written another way: the shell still runs the same program ----
  { id: 'name_amp_quote', group: 'name', shell: 'powershell', expect: 'sudo', command: "& 'sudo' whoami", note: 'the call operator runs the quoted name' },
  { id: 'name_backslash', group: 'name', shell: 'bash', expect: 'sudo', command: '\\sudo ls', note: 'bash drops the backslash and runs sudo' },
  { id: 'name_ansi_c', group: 'name', shell: 'bash', expect: 'sudo', command: "$'\\x73udo' ls", note: "bash decodes $'\\x73udo' to sudo" },
  { id: 'name_cmd_quote', group: 'name', shell: 'cmd', expect: 'net', command: '"net" user', note: 'cmd drops the quotes and runs net' },
  { id: 'name_cmd_caret', group: 'name', shell: 'cmd', expect: 'net', command: 'n^et user', note: 'cmd drops the ^ and runs net' },
  { id: 'name_ps_path', group: 'name', shell: 'powershell', expect: process.platform === 'win32' ? 'sc' : null, command: 'C:\\Windows\\System32\\SC.EXE query', note: 'sc.exe by its full path, in capitals: sc on Windows; elsewhere that path names no program' },
  { id: 'name_cmd_exe', group: 'name', shell: 'cmd', expect: process.platform === 'win32' ? 'sc' : null, command: 'sc.exe stop Spooler', note: 'cmd runs sc.exe for sc.exe as for sc; elsewhere sc.exe is another program' },
  { id: 'name_cmd_path', group: 'name', shell: 'cmd', expect: process.platform === 'win32' ? 'sc' : null, command: '"C:\\Windows\\System32\\SC.EXE" query', note: 'sc.exe by its full path, quoted and in capitals: sc on Windows; elsewhere that path names no program' },
  { id: 'name_gitbash_exe', group: 'name', shell: 'bash', expect: process.platform === 'win32' ? 'sc' : null, command: 'sc.exe query', note: 'Git Bash on Windows runs sc.exe for sc.exe as for sc; elsewhere sc.exe is another program' },
  { id: 'name_gitbash_path', group: 'name', shell: 'bash', expect: process.platform === 'win32' ? 'sc' : null, command: "'C:\\Windows\\System32\\sc.exe' query", note: 'Git Bash runs a quoted Windows path; its backslashes are part of the path. Elsewhere that path names no program' },

  // ---- What a name means in PowerShell: an alias runs its target, not a program of that name ----
  { id: 'meaning_sc', group: 'meaning', shell: 'powershell', expect: null, expectPerShell: { pwsh: 'sc' }, command: 'sc query', note: 'Windows PowerShell 5.1 runs Set-Content, the target of its alias sc; PowerShell 7 has no sc alias and runs sc.exe' },

  // ---- Own functions: a call to the script's own function is not the blocked program, but its body is checked ----
  { id: 'fn_format', group: 'ownfunc', shell: 'bash', expect: null, command: ['format() {', '  printf "%s\\n" "$1"', '}', 'format report.txt'].join(nl), note: 'own function format, called after; body has no blocked program' },
  { id: 'fn_mount', group: 'ownfunc', shell: 'bash', expect: null, command: 'mount() { echo "$1"; }; mount /data', note: 'own function mount, called after' },
  { id: 'fn_sudo', group: 'ownfunc', shell: 'bash', expect: null, command: 'sudo() { echo "refuse"; }; sudo ls', note: 'own function sudo, called after' },
  { id: 'fn_net_ps', group: 'ownfunc', shell: 'powershell', expect: null, command: 'function net { param($a) "net $a" }; net status', note: 'own PowerShell function net, called after' },
  { id: 'fn_sc_ps', group: 'ownfunc', shell: 'powershell', expect: null, command: 'function sc { param($a) $a }; sc query', note: 'own PowerShell function sc, called after' },
  { id: 'fn_body_runs_sudo', group: 'ownfunc', shell: 'bash', expect: 'sudo', command: 'deploy() {' + nl + '  sudo rm -rf /opt/x' + nl + '}' + nl + 'deploy', note: 'own function deploy, but its body runs the real sudo' },
  { id: 'fn_call_before_def', group: 'ownfunc', shell: 'bash', expect: 'sudo', command: 'sudo ls' + nl + 'sudo() { echo "refuse"; }', note: 'sudo called before the definition is the real program' },
  {
    id: 'fn_deploy_script', group: 'ownfunc', shell: 'bash', expect: null,
    command: [
      '#!/bin/bash',
      'set -euo pipefail',
      'ARCHIVE="/srv/release/app-image.tar"',
      'IMAGE="registry.example/app:1.2.3"',
      'halt() {',
      '  echo "ERROR: $*" >&2',
      '  exit 1',
      '}',
      '[ -f "$ARCHIVE" ] || halt "archive missing: $ARCHIVE"',
      'echo "$EXPECTED_SHA  $ARCHIVE" | sha256sum -c - >/dev/null || halt "hash mismatch"',
      'if docker image inspect --format \'{{.Id}}\' "$IMAGE" >/dev/null 2>&1; then',
      '  halt "image already present: $IMAGE"',
      'fi',
      'docker load -i "$ARCHIVE"',
    ].join(nl),
    note: "case 11's whole deployment script, written from the customer's description: its own halt, called after || and inside if",
  },
  { id: 'fn_called_from_fn', group: 'ownfunc', shell: 'bash', expect: null, command: ['halt() { echo "ERROR: $*" >&2; exit 1; }', 'main() { docker load -i "$ARCHIVE" || halt "load failed"; }', 'main'].join(nl), note: 'the own halt, called from another function of the script' },
  { id: 'fn_body_path', group: 'ownfunc', shell: 'bash', expect: 'halt', command: 'halt() { /sbin/halt -p; }; halt', note: 'the body of the own halt runs /sbin/halt' },
  { id: 'fn_path_after', group: 'ownfunc', shell: 'bash', expect: 'halt', command: 'halt() { echo stop; }; /sbin/halt -p', note: 'a path is the program, even after an own halt' },
  { id: 'fn_in_subshell', group: 'ownfunc', shell: 'bash', expect: 'sudo', command: '( sudo() { :; } ); sudo ls', note: 'sudo defined only inside a subshell' },
  { id: 'fn_in_fn', group: 'ownfunc', shell: 'bash', expect: 'sudo', command: 'f() { sudo() { :; }; }; sudo ls', note: 'sudo defined only inside another function, which never runs' },
  { id: 'fn_after_or', group: 'ownfunc', shell: 'bash', expect: 'sudo', command: 'true || sudo() { :; }; sudo ls', note: 'sudo defined only after a || that does not run' },
  { id: 'fn_unset', group: 'ownfunc', shell: 'bash', expect: 'halt', command: 'halt() { echo stop; }; unset -f halt; halt', note: 'unset -f removed the own halt' },
  { id: 'fn_builtin_unset', group: 'ownfunc', shell: 'bash', expect: 'halt', command: 'halt() { echo stop; }; builtin unset -f halt; halt', note: 'builtin unset -f removed the own halt' },
  { id: 'fn_unhash_zsh', group: 'ownfunc', shell: 'zsh', expect: 'halt', command: 'halt() { echo stop; }; unhash -f halt; halt', note: "zsh's unhash -f removed the own halt" },
  { id: 'fn_unset_written_before', group: 'ownfunc', shell: 'bash', expect: 'halt', command: 'cleanup() { unset -f halt; }; halt() { echo stop; }; cleanup; halt', note: 'the unset is written before the definition, but runs when cleanup is called after it' },
  { id: 'fn_call_written_before', group: 'ownfunc', shell: 'bash', expect: 'halt', command: 'halt() { echo stop; }; main() { halt; }; unset -f halt; main', note: 'the call is written before the unset, but runs when main is called after it' },
  { id: 'fn_case_ps', group: 'ownfunc', shell: 'powershell', expect: null, command: "function Net { 'x' }; net status", note: 'PowerShell finds a function whatever the case of its name' },
  { id: 'fn_in_block_ps', group: 'ownfunc', shell: 'powershell', expect: 'net', command: "& { function net { 'x' } }; net user", note: 'net defined only inside a script block' },
  { id: 'fn_remove_item_ps', group: 'ownfunc', shell: 'powershell', expect: 'net', command: "function net { 'x' }; Remove-Item function:net; net user", note: 'Remove-Item function:net removed the own net' },
  { id: 'fn_remove_pipe_ps', group: 'ownfunc', shell: 'powershell', expect: 'net', command: "function net { 'x' }; 'function:net' | Remove-Item; net user", note: 'Remove-Item with the path from the pipeline removed the own net' },
  { id: 'fn_variable_ps', group: 'ownfunc', shell: 'powershell', expect: 'net', command: "function net { 'x' }; $function:net = $null; net user", note: '$function:net = $null removed the own net' },
  { id: 'fn_start_job_ps', group: 'ownfunc', shell: 'powershell', expect: 'net', command: "function net { 'x' }; Start-Job { net user } | Receive-Job -Wait", note: "a job runs in another process, where the script's functions don't exist" },

  // ---- Wrappers: a program a wrapper starts, past the wrapper's own options ----
  { id: 'wrap_env', group: 'wrapper', shell: 'bash', expect: 'sudo', command: 'env sudo ls', note: 'env runs sudo' },
  { id: 'wrap_nohup', group: 'wrapper', shell: 'bash', expect: 'shutdown', command: 'nohup shutdown -h now', note: 'nohup runs shutdown' },
  { id: 'wrap_nohup_sudo', group: 'wrapper', shell: 'bash', expect: 'sudo', command: 'nohup sudo ls', note: 'nohup runs sudo' },
  { id: 'wrap_xargs', group: 'wrapper', shell: 'bash', expect: 'sudo', command: 'echo x | xargs sudo', note: 'xargs runs sudo' },
  { id: 'wrap_timeout', group: 'wrapper', shell: 'bash', expect: 'reboot', command: 'timeout 5 reboot', note: 'timeout runs reboot after its duration' },
  { id: 'wrap_nice', group: 'wrapper', shell: 'bash', expect: 'dd', command: 'nice -n 10 dd if=/dev/zero of=/dev/sda', note: 'nice runs dd after -n 10' },
  { id: 'wrap_nice_sudo', group: 'wrapper', shell: 'bash', expect: 'sudo', command: 'nice sudo ls', note: 'nice runs sudo' },
  { id: 'wrap_sudou', group: 'wrapper', shell: 'bash', expect: 'sudo', command: 'sudo -u root id', note: 'sudo itself is blocked' },
  { id: 'wrap_sudou_ls', group: 'wrapper', shell: 'bash', expect: 'sudo', command: 'sudo -u root ls', note: 'sudo itself is blocked' },
  { id: 'wrap_exec', group: 'wrapper', shell: 'bash', expect: 'su', command: 'exec su -', note: 'exec runs su' },
  { id: 'wrap_exec_sudo', group: 'wrapper', shell: 'bash', expect: 'sudo', command: 'exec sudo ls', note: 'exec runs sudo' },
  { id: 'wrap_command', group: 'wrapper', shell: 'bash', expect: 'sudo', command: 'command sudo ls', note: 'command runs sudo' },
  { id: 'wrap_chain', group: 'wrapper', shell: 'bash', expect: 'reboot', command: 'env -i FOO=1 nohup nice -n 5 reboot', note: 'env runs nohup, which runs nice, which runs reboot' },
  { id: 'wrap_env_options', group: 'wrapper', shell: 'zsh', expect: 'reboot', command: 'env -u HOME --chdir=/tmp reboot', note: "env's options and their values" },
  { id: 'wrap_timeout_options', group: 'wrapper', shell: 'sh', expect: 'reboot', command: 'timeout -s KILL --kill-after=2 5 reboot', note: "timeout's options, then its duration" },
  { id: 'wrap_nice_old', group: 'wrapper', shell: 'bash', expect: 'reboot', command: 'nice -10 reboot', note: 'the old way to write nice -n 10' },
  { id: 'wrap_xargs_options', group: 'wrapper', shell: 'bash', expect: 'reboot', command: 'ls | xargs -n 1 -I{} reboot {}', note: "xargs's options, with the value in the next word and in the same one" },
  { id: 'wrap_exec_name', group: 'wrapper', shell: 'bash', expect: 'reboot', command: 'exec -a name reboot', note: "exec's -a takes a name" },
  { id: 'wrap_dashdash', group: 'wrapper', shell: 'bash', expect: 'reboot', command: 'nohup -- reboot', note: '-- ends the options' },
  { id: 'wrap_runtime_option', group: 'wrapper', shell: 'bash', expect: 'reboot', command: 'nice $NICE_OPTS reboot', note: '$NICE_OPTS may be options, so reboot may be the program' },
  { id: 'wrap_option_value', group: 'wrapper', shell: 'bash', expect: null, command: 'env -u sudo ls', note: 'sudo is the variable env unsets; env runs ls' },
  { id: 'wrap_argument', group: 'wrapper', shell: 'bash', expect: null, command: 'timeout 5 echo reboot', note: 'reboot is what echo prints' },
  { id: 'wrap_command_v', group: 'wrapper', shell: 'bash', expect: null, command: 'command -v sudo', note: 'command -v only says where sudo is' },
  { id: 'wrap_runtime', group: 'wrapper', shell: 'bash', expect: 'unknowable', command: 'env "$CMD"', note: 'env runs the program in $CMD, known only at run time' },
  { id: 'wrap_ownfunc_program', group: 'wrapper', shell: 'bash', expect: 'sudo', command: 'sudo() { echo "refuse"; }; env sudo ls', note: "env starts the program sudo, not the script's function of that name, which only the shell knows" },
  { id: 'wrap_ownfunc_wrapper', group: 'wrapper', shell: 'bash', expect: null, command: 'env() { echo "$@"; }; env sudo ls', note: "env is the script's own function, which only prints its words" },
  { id: 'wrap_ps_env', group: 'wrapper', shell: 'powershell', expect: 'sudo', command: 'env sudo ls', note: 'env is a program, so it runs sudo from PowerShell too' },
  { id: 'wrap_startproc', group: 'wrapper', shell: 'powershell', expect: process.platform === 'win32' ? 'format' : null, command: "Start-Process -FilePath format.com -ArgumentList 'D:'", note: 'Start-Process runs format.com: format on Windows; elsewhere that name is no program' },
  { id: 'wrap_startproc_sudo', group: 'wrapper', shell: 'powershell', expect: 'sudo', command: 'Start-Process sudo', note: 'the first word without a parameter name is FilePath' },
  { id: 'wrap_startproc_alias', group: 'wrapper', shell: 'powershell', expect: process.platform === 'win32' ? 'format' : null, command: 'start -Wait format.com D:', note: 'start is an alias of Start-Process on Windows; elsewhere it is no alias and names no program' },
  { id: 'wrap_startproc_short', group: 'wrapper', shell: 'powershell', expect: 'shutdown', command: 'saps -Wait -Fi shutdown', note: 'saps is an alias of Start-Process, and -Fi is FilePath shortened' },
  { id: 'wrap_startproc_colon', group: 'wrapper', shell: 'powershell', expect: 'shutdown', command: "Start-Process -FilePath:'shutdown'", note: "FilePath's value after a colon" },
  { id: 'wrap_startproc_named', group: 'wrapper', shell: 'powershell', expect: 'shutdown', command: 'Start-Process now -FilePath shutdown', note: 'FilePath by name, wherever it is; now is the argument' },
  { id: 'wrap_startproc_args', group: 'wrapper', shell: 'powershell', expect: null, command: 'Start-Process notepad -ArgumentList format', note: 'format is what notepad opens' },
  { id: 'wrap_startproc_runtime', group: 'wrapper', shell: 'powershell', expect: 'unknowable', command: 'Start-Process $exe', note: 'the program is the value of $exe' },
  { id: 'wrap_startproc_splat', group: 'wrapper', shell: 'powershell', expect: 'shutdown', command: 'Start-Process @params shutdown', note: 'without a FilePath in @params, shutdown is FilePath' },
  { id: 'wrap_startproc_splat_only', group: 'wrapper', shell: 'powershell', expect: 'unknowable', command: 'Start-Process @params', note: '@params may hold FilePath, known only at run time' },
  { id: 'wrap_startproc_dashdash', group: 'wrapper', shell: 'powershell', expect: 'shutdown', command: 'Start-Process -- shutdown', note: '-- ends the parameters, and shutdown is FilePath' },
  { id: 'wrap_startproc_wi', group: 'wrapper', shell: 'powershell', expect: 'shutdown', expectPerShell: { pwsh: null }, command: 'Start-Process -Wi Hidden shutdown', note: 'in Windows PowerShell 5.1 -Wi is -WindowStyle; in PowerShell 7 it is -WhatIf, so Hidden is FilePath and nothing runs' },
  { id: 'wrap_cmdstart', group: 'wrapper', shell: 'cmd', expect: 'format', command: 'start format D:', note: 'cmd start runs format' },
  { id: 'wrap_cmdstart_net', group: 'wrapper', shell: 'cmd', expect: 'net', command: 'start net user', note: 'cmd start runs net' },
  { id: 'wrap_cmdstart_title', group: 'wrapper', shell: 'cmd', expect: 'format', command: 'start /wait "" format D:', note: 'the first word in quotes is the window title' },
  { id: 'wrap_cmdstart_switches', group: 'wrapper', shell: 'cmd', expect: 'format', command: 'start /D C:\\ /b format D:', note: '/D takes a folder' },
  { id: 'wrap_cmdstart_titlename', group: 'wrapper', shell: 'cmd', expect: null, command: 'start "format" notepad', note: 'format is the window title; start runs notepad' },
  { id: 'wrap_call', group: 'wrapper', shell: 'cmd', expect: 'net', command: 'call net stop Spooler', note: 'cmd call runs net' },
  { id: 'wrap_call_user', group: 'wrapper', shell: 'cmd', expect: 'net', command: 'call net user', note: 'cmd call runs net' },
  { id: 'wrap_call_label', group: 'wrapper', shell: 'cmd', expect: null, command: 'call :format D:', note: 'format is a label of a batch file, not a program' },

  // ---- Inline shells: a blocked program in the command a shell is started with ----
  { id: 'inline_bashc', group: 'inline', shell: 'bash', expect: 'sudo', command: "bash -c 'sudo ls'", note: 'bash -c runs sudo' },
  { id: 'inline_shc', group: 'inline', shell: 'bash', expect: 'reboot', command: 'sh -c "reboot"', note: 'sh -c runs reboot' },
  { id: 'inline_zshc', group: 'inline', shell: 'zsh', expect: 'shutdown', command: "zsh -c 'shutdown -h now'", note: 'zsh -c runs shutdown' },
  { id: 'inline_pwshcmd', group: 'inline', shell: 'powershell', expect: 'net', command: "pwsh -Command 'net stop Spooler'", note: 'pwsh -Command runs net' },
  { id: 'inline_pwshenc', group: 'inline', shell: 'powershell', expect: 'net', command: 'pwsh -EncodedCommand bgBlAHQAIABzAHQAbwBwACAAUwBwAG8AbwBsAGUAcgA=', note: 'base64 of "net stop Spooler"' },
  { id: 'inline_pwshenc_short', group: 'inline', shell: 'powershell', expect: 'net', command: 'powershell -enc bgBlAHQAIABzAHQAbwBwACAAUwBwAG8AbwBsAGUAcgA=', note: '-enc short form' },
  { id: 'inline_cmdc', group: 'inline', shell: 'cmd', expect: 'net', command: 'cmd /c net stop Spooler', note: 'cmd /c runs net' },
  { id: 'inline_bashlc', group: 'inline', shell: 'bash', expect: 'sudo', command: "bash -lc 'sudo ls'", note: '-l and -c in one word, the way start_process starts bash' },
  { id: 'inline_bash_opt', group: 'inline', shell: 'bash', expect: 'sudo', command: "bash -o pipefail -c 'sudo ls'", note: '-o takes the next word, pipefail, as its value' },
  { id: 'inline_bash_c_first', group: 'inline', shell: 'bash', expect: 'sudo', command: "bash -c -e 'sudo ls'", note: 'options can follow -c: the command is the first word that is not an option' },
  { id: 'inline_bash_second', group: 'inline', shell: 'bash', expect: 'sudo', command: "bash -c 'echo hi; sudo ls'", note: 'the second command in the text' },
  { id: 'inline_bash_var', group: 'inline', shell: 'bash', expect: 'sudo', command: 'bash -c "cd $HOME && sudo ls"', note: 'the outer shell fills in $HOME, and sudo runs whatever it is' },
  { id: 'inline_nested', group: 'inline', shell: 'bash', expect: 'sudo', command: "bash -c \"sh -c 'sudo ls'\"", note: 'a shell started by a shell started with a command' },
  { id: 'inline_fishc', group: 'inline', shell: 'bash', expect: 'sudo', command: "fish -c 'sudo ls'", note: 'fish -c runs sudo' },
  { id: 'inline_fish_command', group: 'inline', shell: 'bash', expect: 'sudo', command: "fish --command 'sudo ls'", note: "fish's long form of -c" },
  { id: 'inline_env', group: 'inline', shell: 'bash', expect: 'sudo', command: "env bash -c 'sudo ls'", note: 'env starts bash, and bash runs sudo' },
  { id: 'inline_nohup_var', group: 'inline', shell: 'bash', expect: 'reboot', command: 'nohup sh -c "sleep $T; reboot"', note: 'nohup starts sh with a text that has $T in it' },
  { id: 'inline_bash_from_ps', group: 'inline', shell: 'powershell', expect: 'sudo', command: "bash -c 'sudo ls'", note: 'bash (Git Bash or WSL) started from PowerShell' },
  { id: 'inline_cmd_from_bash', group: 'inline', shell: 'bash', expect: 'net', command: 'cmd //c net stop Spooler', note: 'Git Bash passes //c to cmd as /c' },
  { id: 'inline_powershellcmd', group: 'inline', shell: 'powershell', expect: 'net', command: 'powershell -Command "net stop Spooler"', note: 'Windows PowerShell -Command runs net' },
  { id: 'inline_ps_positional', group: 'inline', shell: 'powershell', expect: 'net', command: 'powershell net stop Spooler', note: 'Windows PowerShell runs words given without -Command as a command' },
  { id: 'inline_ps_e', group: 'inline', shell: 'powershell', expect: 'net', command: 'powershell -e bgBlAHQAIABzAHQAbwBwACAAUwBwAG8AbwBsAGUAcgA=', note: '-e is -EncodedCommand too' },
  { id: 'inline_pwsh_opts', group: 'inline', shell: 'powershell', expect: 'net', command: "pwsh -NoProfile -ExecutionPolicy Bypass -c 'net stop Spooler'", note: 'a switch, a parameter with its value, then -c' },
  { id: 'inline_pwsh_words', group: 'inline', shell: 'powershell', expect: 'net', command: 'pwsh -Command net stop Spooler', note: 'pwsh joins the words after -Command into one command' },
  { id: 'inline_pwsh_var', group: 'inline', shell: 'powershell', expect: 'net', command: 'pwsh -Command "net user $name"', note: 'PowerShell fills in $name, and net runs whatever it is' },
  { id: 'inline_cmd_from_ps', group: 'inline', shell: 'powershell', expect: 'net', command: 'cmd /c net stop Spooler', note: 'cmd started from PowerShell' },
  { id: 'inline_cmd_from_ps_quoted', group: 'inline', shell: 'powershell', expect: 'net', command: 'cmd /c "net stop Spooler"', note: 'cmd drops the quotes around the command' },
  { id: 'inline_cmdk', group: 'inline', shell: 'cmd', expect: 'net', command: 'cmd /k net stop Spooler', note: 'cmd /k runs net, then stays open' },
  { id: 'inline_cmd_quoted', group: 'inline', shell: 'cmd', expect: 'net', command: 'cmd /c "echo hi & net stop Spooler"', note: 'the quotes keep & for the inner cmd, which runs both commands' },
  { id: 'inline_cmd_switches', group: 'inline', shell: 'cmd', expect: 'net', command: 'cmd /q /d /c net stop Spooler', note: 'switches before /c' },
  { id: 'inline_cmd_var', group: 'inline', shell: 'cmd', expect: 'net', command: 'cmd /c net user %USERNAME%', note: 'cmd fills in %USERNAME%, and net runs whatever it is' },
  { id: 'inline_cmd_path_quoted', group: 'inline', shell: 'cmd', expect: process.platform === 'win32' ? 'net' : null, command: 'cmd /c "C:\\Program Files\\Tools\\net.exe" user', note: 'cmd keeps the quotes around a program path with a space in it: net on Windows; elsewhere that path names no program' },
  { id: 'inline_bashc_ok', group: 'inline', shell: 'bash', expect: null, command: "bash -c 'ls -la'", note: 'an allowed program inside bash -c' },
  { id: 'inline_bash_arg0_ok', group: 'inline', shell: 'bash', expect: null, command: "bash -c 'echo \"$0\"' sudo", note: 'only the word after -c is the command; sudo is its $0' },
  { id: 'inline_bash_text_ok', group: 'inline', shell: 'bash', expect: null, command: "bash -c 'echo sudo ls'", note: 'sudo is text that echo prints' },
  { id: 'inline_ownfunc_ok', group: 'inline', shell: 'bash', expect: null, command: 'bash() { echo "$@"; }; bash -c \'sudo ls\'', note: "bash is the script's own function, which only prints its words" },
  { id: 'inline_pwsh_text_ok', group: 'inline', shell: 'powershell', expect: null, command: "pwsh -Command \"Write-Output 'net stop Spooler'\"", note: 'the command is a string that PowerShell prints' },
  { id: 'inline_cmd_text_ok', group: 'inline', shell: 'cmd', expect: null, command: 'cmd /c echo "a & net stop Spooler"', note: 'a quoted & is text for the inner cmd too' },
  { id: 'inline_cmd_from_ps_text_ok', group: 'inline', shell: 'powershell', expect: null, command: "cmd /c echo 'a & net stop Spooler'", note: 'PowerShell passes the text to cmd in quotes' },
  { id: 'inline_bash_runtime', group: 'inline', shell: 'bash', expect: 'unknowable', command: 'bash -c "$CMD"', note: 'the command is in $CMD, known only at run time' },
  // eval and Invoke-Expression run a command text in the same shell
  { id: 'inline_eval', group: 'inline', shell: 'bash', expect: 'sudo', command: "eval 'sudo ls'", note: 'eval runs sudo' },
  { id: 'inline_eval_words', group: 'inline', shell: 'bash', expect: 'sudo', command: 'eval sudo ls', note: 'eval joins its words into the command' },
  { id: 'inline_eval_zsh', group: 'inline', shell: 'zsh', expect: 'reboot', command: 'eval "reboot"', note: 'zsh eval runs reboot' },
  { id: 'inline_eval_in_bashc', group: 'inline', shell: 'bash', expect: 'sudo', command: "bash -c \"eval 'sudo ls'\"", note: 'eval inside the text bash -c runs' },
  { id: 'inline_iex', group: 'inline', shell: 'powershell', expect: 'net', command: "Invoke-Expression 'net stop Spooler'", note: 'Invoke-Expression runs net' },
  { id: 'inline_iex_alias', group: 'inline', shell: 'powershell', expect: 'net', command: "iex 'net user'", note: 'iex is its alias' },
  { id: 'inline_iex_command', group: 'inline', shell: 'powershell', expect: 'net', command: "Invoke-Expression -Command 'net user'", note: 'the text given by its parameter name' },
  { id: 'inline_eval_ok', group: 'inline', shell: 'bash', expect: null, command: "eval 'echo sudo'", note: 'sudo is text that echo prints, and the text is all there to check' },
  { id: 'inline_iex_ok', group: 'inline', shell: 'powershell', expect: null, command: "iex 'Get-Date'", note: 'an allowed command, all there to check' },
  { id: 'inline_eval_runtime_part', group: 'inline', shell: 'bash', expect: 'unknowable', command: 'eval "sudo $X"', note: 'part of the text is known only at run time, so eval stays unseen' },
  { id: 'inline_iex_pipe', group: 'inline', shell: 'powershell', expect: 'unknowable', command: "'net user' | iex", note: 'the text comes from the pipeline' },

  // ---- Run time: the program is chosen when the command runs, so the check can't see it ----
  { id: 'rt_eval', group: 'runtime', shell: 'bash', expect: 'unknowable', command: 'eval "$CMD"', note: 'the program is in $CMD, unknown until run time' },
  { id: 'rt_iex', group: 'runtime', shell: 'powershell', expect: 'unknowable', command: 'Invoke-Expression $cmd', note: 'the program is in $cmd' },
  { id: 'rt_amp_var', group: 'runtime', shell: 'powershell', expect: 'unknowable', command: '& $tool stop Spooler', note: 'the program is the value of $tool' },

  // ---- A script file: its commands aren't in the text ----
  { id: 'file_bash', group: 'file', shell: 'bash', expect: 'unknowable', command: 'bash deploy.sh', note: 'the commands are in deploy.sh, not in the text' },

  // ---- The 14k-char case ----
  { id: 'long01', group: 'long', shell: 'powershell', expect: null, command: long01, note: '14k chars; su only as Spanish prose in a here-string' },

  // ---- Controls: a plain blocked program must always be caught ----
  { id: 'ctl_sudo', group: 'control', shell: 'bash', expect: 'sudo', command: 'sudo ls', note: 'plain' },
  { id: 'ctl_chain', group: 'control', shell: 'bash', expect: 'sudo', command: 'echo ok && sudo ls', note: 'chained' },
  { id: 'ctl_pipe', group: 'control', shell: 'bash', expect: 'iptables', command: 'echo x | iptables -L', note: 'piped' },
  { id: 'ctl_sub', group: 'control', shell: 'bash', expect: 'sudo', command: 'echo "$(sudo id)"', note: 'in $() inside double quotes' },
  { id: 'ctl_path', group: 'control', shell: 'bash', expect: 'sudo', command: '/usr/bin/sudo ls', note: 'path to sudo' },
  { id: 'ctl_net', group: 'control', shell: 'powershell', expect: 'net', command: 'net stop Spooler', note: 'plain net' },
  { id: 'ctl_netexe', group: 'control', shell: 'powershell', expect: process.platform === 'win32' ? 'net' : null, command: 'C:\\Windows\\System32\\net.exe user', note: 'net.exe by path: net on Windows; elsewhere that path names no program, so nothing runs' },
  { id: 'ctl_allow', group: 'control', shell: 'bash', expect: null, command: 'echo "Hello World"', note: 'plainly safe' },
];
