import test from "node:test";
import assert from "node:assert/strict";
import { buildFallbackResponse } from "../controllers/sageController.js";

test("SAGE fallback explains the concept when a student asks for help", () => {
  const reply = buildFallbackResponse("React state & component behavior", [
    { role: "user", content: "I'm confused, can you explain this?" },
  ]);

  assert.match(reply, /Good question/);
  assert.match(reply, /state snapshot/);
  assert.match(reply, /Compare the value/);
});

test("SAGE fallback gives an analogy when a student asks for an example", () => {
  const reply = buildFallbackResponse("Authentication & authorization", [
    { role: "user", content: "Can you give me an example?" },
  ]);

  assert.match(reply, /For example/);
  assert.match(reply, /staff-only door/);
});

test("SAGE fallback varies its follow-up tone and responds to answer requests with guidance", () => {
  const reply = buildFallbackResponse("HTTP methods & API behavior", [
    { role: "user", content: "What should I do here?" },
    { role: "assistant", content: "Start with the request." },
    { role: "user", content: "Which answer is correct?" },
  ]);

  assert.match(reply, /Totally fair/);
  assert.match(reply, /timeout/);
  assert.match(reply, /stable piece of information/);
});

test("SAGE greets a greeting instead of replying with unrelated assessment advice", () => {
  const reply = buildFallbackResponse("HTTP methods & API behavior", [
    { role: "user", content: "hey" },
  ]);

  assert.match(reply, /^Hey!/);
  assert.match(reply, /What part of this question/);
  assert.doesNotMatch(reply, /timeout|retry|server committed/i);
});

test("SAGE responds naturally to a repeated greeting without repeating the first reply", () => {
  const firstReply = buildFallbackResponse("HTTP methods & API behavior", [
    { role: "user", content: "hello" },
  ]);
  const secondReply = buildFallbackResponse("HTTP methods & API behavior", [
    { role: "user", content: "hello" },
    { role: "assistant", content: firstReply },
    { role: "user", content: "hey" },
  ]);

  assert.match(secondReply, /^Hi again!/);
  assert.notEqual(secondReply, firstReply);
});
