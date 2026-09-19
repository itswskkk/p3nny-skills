#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const ALL_SKILLS = fs
  .readdirSync(SKILLS_DIR)
  .filter((name) => fs.statSync(path.join(SKILLS_DIR, name)).isDirectory());

function parseArgs(argv) {
  const args = { global: false, help: false, skills: [] };
  if (argv[0] === 'add') {
    argv = argv.slice(1);
  }
  for (const arg of argv) {
    if (arg === '--global' || arg === '-g') {
      args.global = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else {
      args.skills.push(arg);
    }
  }
  return args;
}

function printHelp() {
  console.log(`
p3nny-skills - install these skills into a .claude/skills directory

Usage:
  npx p3nny-skills add [skill-name...] [options]

Options:
  --global, -g   Install into ~/.claude/skills instead of ./.claude/skills
  --help, -h     Show this help

Available skills:
  ${ALL_SKILLS.join('\n  ')}

Examples:
  npx p3nny-skills add                     Install all skills into ./.claude/skills
  npx p3nny-skills add workspace-sentinel  Install just workspace-sentinel
  npx p3nny-skills add --global            Install all skills into ~/.claude/skills
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const targets = args.skills.length > 0 ? args.skills : ALL_SKILLS;
  const unknown = targets.filter((name) => !ALL_SKILLS.includes(name));
  if (unknown.length > 0) {
    console.error(`Unknown skill(s): ${unknown.join(', ')}`);
    console.error(`Available skills: ${ALL_SKILLS.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const destRoot = args.global
    ? path.join(os.homedir(), '.claude', 'skills')
    : path.join(process.cwd(), '.claude', 'skills');

  fs.mkdirSync(destRoot, { recursive: true });

  for (const skill of targets) {
    const src = path.join(SKILLS_DIR, skill);
    const dest = path.join(destRoot, skill);
    fs.cpSync(src, dest, { recursive: true });
    console.log(`Installed ${skill} -> ${dest}`);
  }
}

main();
