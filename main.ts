// unsent-entry1 — program/v1 entry for "Unsent: The Micro-Confession Sprint".
//
// The program writes one two-part micro-confession to /output/entry.txt:
//   line 1 — a To: line naming who the message was meant for;
//   line 2 — the unsent message itself, one line, exactly as it was typed.
//
// The work is original, written for this competition alone. It stays inside
// the gate: the whole file is 1 to 260 characters, the message line is at
// most 200 characters, and the file holds nothing but the two lines.
//
// Deterministic by design: no network, no clock, no randomness, no input
// from the environment. Two runs write byte-identical output.
//
// Run with Node 22.18 or later (the grader runs Node 22.23.4):
//   node main.ts

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// ---------------------------------------------------------------------------
// Constants: the gate, the paths, and the confession itself.
// ---------------------------------------------------------------------------

const OUTPUT_PATH = "/output/entry.txt";
const GATE_MIN_CHARS = 1;
const GATE_MAX_CHARS = 260;
const MESSAGE_MAX_CHARS = 200;
const TO_PREFIX = "To: ";
const LINE_BREAK = "\n";

// The addressee: a relationship, never a full name and never a handle.
// The line and the message need each other — swapping the addressee would
// break the confession, because only a brother shares the night it names.
const ADDRESSEE_LABEL = "my brother";

// The unsent message, one line, exactly as it was typed. The reason it
// stayed in drafts is felt inside the words — the phone put down, the
// telling held back — never stated as an explanation after the fact.
const UNSENT_MESSAGE =
  "I almost texted you the night Mum fell, then I put the phone down, " +
  "because once I told you it would be real and I wasn't ready for " +
  "either of us to know yet.";

// ---------------------------------------------------------------------------
// Small helpers: counting, splitting, and naming the pieces.
// ---------------------------------------------------------------------------

// Counts Unicode code points, so a character is a character even when its
// UTF-8 encoding spans several bytes. The gate counts characters, and the
// program measures with the same ruler. Spreading a string iterates its
// code points one by one, which is exactly the count the gate wants.
function countCodePoints(text: string): number {
  const codePointList = [...text];
  const counted = codePointList.length;
  return counted;
}

// Splits the entry into its lines without keeping the line breaks.
function splitEntryLines(text: string): string[] {
  const foundLines = text.split(LINE_BREAK);
  return foundLines;
}

// Builds the To: line from the addressee label.
function buildToLine(): string {
  const toLine = TO_PREFIX + ADDRESSEE_LABEL;
  return toLine;
}

// Returns the unsent message line exactly as it was typed.
function buildMessageLine(): string {
  const messageLine = UNSENT_MESSAGE;
  return messageLine;
}

// The addressee text after the To: prefix, trimmed of surrounding space.
function addresseeText(toLine: string): string {
  const named = toLine.slice(TO_PREFIX.length).trim();
  return named;
}

// ---------------------------------------------------------------------------
// Assembly: joining the two parts into the entry text.
// ---------------------------------------------------------------------------

type AssembledEntry = {
  text: string;
  toLine: string;
  messageLine: string;
  totalChars: number;
  messageChars: number;
  addresseeChars: number;
  lineCount: number;
};

function assembleEntry(): AssembledEntry {
  const toLine = buildToLine();
  const messageLine = buildMessageLine();
  const text = toLine + LINE_BREAK + messageLine;
  const totalChars = countCodePoints(text);
  const messageChars = countCodePoints(messageLine);
  const addresseeChars = countCodePoints(addresseeText(toLine));
  const entryLines = splitEntryLines(text);
  const lineCount = entryLines.length;
  const assembled: AssembledEntry = {
    text,
    toLine,
    messageLine,
    totalChars,
    messageChars,
    addresseeChars,
    lineCount,
  };
  return assembled;
}

// ---------------------------------------------------------------------------
// Validation: the sealed scorer's gate, checked before anything is written.
// ---------------------------------------------------------------------------

type ValidationOutcome = {
  ok: boolean;
  problems: string[];
};

function validateEntry(assembled: AssembledEntry): ValidationOutcome {
  const problems: string[] = [];

  if (assembled.totalChars < GATE_MIN_CHARS) {
    problems.push("entry is empty");
  }
  if (assembled.totalChars > GATE_MAX_CHARS) {
    problems.push(
      "entry is " +
        String(assembled.totalChars) +
        " characters, over the gate of " +
        String(GATE_MAX_CHARS),
    );
  }
  if (assembled.lineCount !== 2) {
    problems.push(
      "entry has " +
        String(assembled.lineCount) +
        " lines, the confession needs exactly two",
    );
  }
  if (assembled.toLine.startsWith(TO_PREFIX) === false) {
    problems.push("first line must start with the To: prefix");
  }
  if (assembled.addresseeChars === 0) {
    problems.push("To: line names nobody");
  }
  if (assembled.messageChars > MESSAGE_MAX_CHARS) {
    problems.push(
      "message line is " +
        String(assembled.messageChars) +
        " characters, over the limit of " +
        String(MESSAGE_MAX_CHARS),
    );
  }
  if (assembled.messageLine.trim().length === 0) {
    problems.push("message line is only white space");
  }
  if (assembled.messageLine.includes(LINE_BREAK)) {
    problems.push("message line holds a line break");
  }
  if (assembled.text.trim().length === 0) {
    problems.push("entry is only white space");
  }
  if (assembled.text.endsWith(LINE_BREAK)) {
    problems.push("entry ends with a line break");
  }

  const outcome: ValidationOutcome = {
    ok: problems.length === 0,
    problems,
  };
  return outcome;
}

// ---------------------------------------------------------------------------
// Writing: the file lands at /output/entry.txt, then is read back and proven.
// ---------------------------------------------------------------------------

// Creates the output directory when it is missing. The guard for this file
// asks every try line to carry its first statement on the same line, so the
// directory call sits beside the try keyword instead of below it.
function ensureOutputDirectory(): void {
  const outputDirectory = dirname(OUTPUT_PATH);
  try { mkdirSync(outputDirectory, { recursive: true }); } catch (caughtFailure) {
    const failureMessage =
      caughtFailure instanceof Error
        ? caughtFailure.message
        : String(caughtFailure);
    throw new Error(
      "could not create output directory " +
        outputDirectory +
        ": " +
        failureMessage,
    );
  }
}

function writeEntryFile(text: string): void {
  ensureOutputDirectory();
  try { writeFileSync(OUTPUT_PATH, text, "utf8"); } catch (caughtFailure) {
    const failureMessage =
      caughtFailure instanceof Error
        ? caughtFailure.message
        : String(caughtFailure);
    throw new Error(
      "could not write " + OUTPUT_PATH + ": " + failureMessage,
    );
  }
}

function sha256Hex(text: string): string {
  const digest = createHash("sha256").update(text, "utf8").digest("hex");
  return digest;
}

type VerificationOutcome = {
  matches: boolean;
  sha256: string;
  readBackChars: number;
  readBackBytes: number;
};

function verifyWritten(expectedText: string): VerificationOutcome {
  let readBack = "";
  try { readBack = readFileSync(OUTPUT_PATH, "utf8"); } catch (caughtFailure) {
    const failureMessage =
      caughtFailure instanceof Error
        ? caughtFailure.message
        : String(caughtFailure);
    throw new Error(
      "could not read back " + OUTPUT_PATH + ": " + failureMessage,
    );
  }
  const matches = readBack === expectedText;
  const digest = sha256Hex(readBack);
  const readBackChars = countCodePoints(readBack);
  const readBackBytes = Buffer.byteLength(readBack, "utf8");
  const verification: VerificationOutcome = {
    matches,
    sha256: digest,
    readBackChars,
    readBackBytes,
  };
  return verification;
}

// ---------------------------------------------------------------------------
// Reporting: one readable status block on stdout for the run log.
// ---------------------------------------------------------------------------

function reportRun(
  assembled: AssembledEntry,
  verification: VerificationOutcome,
): void {
  const lines: string[] = [];
  lines.push("status: ok");
  lines.push("output: " + OUTPUT_PATH);
  lines.push("lines: " + String(assembled.lineCount));
  lines.push("total_chars: " + String(assembled.totalChars));
  lines.push("message_chars: " + String(assembled.messageChars));
  lines.push("addressee_chars: " + String(assembled.addresseeChars));
  lines.push("bytes: " + String(verification.readBackBytes));
  lines.push("sha256: " + verification.sha256);
  lines.push("matches_written: " + String(verification.matches));
  const report = lines.join(LINE_BREAK);
  console.log(report);
}

// ---------------------------------------------------------------------------
// Main: assemble, validate, write, verify, report. Any failure stops the
// run with a clear error instead of writing a file that fails the gate.
// ---------------------------------------------------------------------------

function main(): void {
  const assembled = assembleEntry();
  const validation = validateEntry(assembled);
  if (validation.ok === false) {
    const joinedProblems = validation.problems.join("; ");
    throw new Error("entry failed validation: " + joinedProblems);
  }
  writeEntryFile(assembled.text);
  const verification = verifyWritten(assembled.text);
  if (verification.matches === false) {
    throw new Error("read-back text differs from the assembled entry");
  }
  reportRun(assembled, verification);
}

main();
