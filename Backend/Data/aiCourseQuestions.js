"use strict";

// General 7-day introductory AI course assessment (30 MCQs).
// answer is the zero-based index of the correct option.
const aiCourseQuestions = [
  { question: "What does AI stand for?", options: ["Automated Internet", "Artificial Intelligence", "Advanced Interface", "Applied Integration"], answer: 1 },
  { question: "Which statement best describes Artificial Intelligence?", options: ["A system that can perform tasks commonly associated with human intelligence", "A type of computer monitor", "A programming language only", "A file storage format"], answer: 0 },
  { question: "What is Machine Learning?", options: ["A way to teach computers patterns from data", "A method for cleaning keyboards", "A type of printer", "A website layout technique"], answer: 0 },
  { question: "Which is an example of generative AI?", options: ["A calculator adding two numbers", "A tool that drafts text from a prompt", "A power switch", "A USB cable"], answer: 1 },
  { question: "What is a prompt in generative AI?", options: ["The instruction or input given to the AI", "The computer's serial number", "A type of database", "A screen resolution"], answer: 0 },
  { question: "Which prompt is generally most useful?", options: ["Do something", "Write", "Create a 100-word beginner-friendly summary of solar energy", "Anything is fine"], answer: 2 },
  { question: "Why should you provide context in a prompt?", options: ["It helps the AI understand the task and audience", "It guarantees every answer is correct", "It turns off internet access", "It makes every response shorter"], answer: 0 },
  { question: "What is a hallucination in generative AI?", options: ["An AI response that presents incorrect or invented information as fact", "A computer overheating", "A verified source", "A file backup"], answer: 0 },
  { question: "What should you do with important AI-generated facts?", options: ["Accept them without checking", "Verify them using reliable sources", "Remove all sources", "Assume they are always current"], answer: 1 },
  { question: "Which task is a suitable use of generative AI?", options: ["Brainstorming ideas for a presentation", "Replacing all human judgement in every situation", "Guaranteeing a medical diagnosis", "Proving a claim without evidence"], answer: 0 },
  { question: "What is supervised learning typically trained with?", options: ["Labeled examples", "Only random numbers", "No data at all", "Only images of keyboards"], answer: 0 },
  { question: "What is a dataset?", options: ["A collection of related data", "A computer fan", "A text formatting style", "A power supply"], answer: 0 },
  { question: "In AI, what is a model?", options: ["A learned system that maps inputs to outputs", "Only a 3D drawing", "A spreadsheet cell", "A network cable"], answer: 0 },
  { question: "What is one reason an AI model may give biased results?", options: ["Its training data or design may contain bias", "It always has perfect knowledge", "It never uses data", "The screen is too bright"], answer: 0 },
  { question: "Which practice helps protect privacy when using AI tools?", options: ["Paste passwords into every prompt", "Share private records publicly", "Avoid entering sensitive personal or confidential data unless approved and protected", "Use the same password everywhere"], answer: 2 },
  { question: "What does human-in-the-loop mean?", options: ["People review or guide important AI decisions", "AI removes all human oversight", "A computer is inside a person", "A model runs without input"], answer: 0 },
  { question: "Which is a good way to use AI for email drafting?", options: ["Provide audience, purpose, and tone, then review the draft", "Send the first output without reading it", "Include confidential credentials", "Ask it to impersonate someone without permission"], answer: 0 },
  { question: "How can AI assist with learning?", options: ["Explain concepts at different levels and create practice questions", "Guarantee exam success without study", "Replace all practice", "Make sources unnecessary"], answer: 0 },
  { question: "Which prompt asks for a more structured response?", options: ["Tell me stuff", "Compare three tools in a table with pros and cons", "Say anything", "No instructions"], answer: 1 },
  { question: "What is an iterative prompting workflow?", options: ["Refining instructions based on the previous response", "Never changing a prompt", "Deleting the question", "Turning off the computer"], answer: 0 },
  { question: "What should you do before publishing AI-generated content?", options: ["Check accuracy, tone, rights, and sensitive information", "Assume it is error-free", "Remove all human review", "Publish private data"], answer: 0 },
  { question: "Which is a responsible approach to AI-created images?", options: ["Misrepresent them as authentic evidence", "Respect applicable rights and disclose AI use when appropriate", "Use any person's likeness in any context", "Ignore platform rules"], answer: 1 },
  { question: "What does automation with AI aim to do?", options: ["Assist or streamline repeatable tasks", "Make every task impossible", "Remove the need to check outputs", "Guarantee zero errors"], answer: 0 },
  { question: "Which task is best handled with extra human review?", options: ["A high-impact decision affecting someone's rights or wellbeing", "Rephrasing a casual sentence", "Listing brainstorming ideas", "Suggesting presentation titles"], answer: 0 },
  { question: "What is the purpose of a system instruction in an AI application?", options: ["Set high-level behavior and constraints for the assistant", "Change the monitor size", "Compress an image file", "Create a physical network"], answer: 0 },
  { question: "Why can an AI answer become outdated?", options: ["Its information may not include recent events or updates", "AI always updates itself with every event", "All websites are static", "Dates cannot be represented digitally"], answer: 0 },
  { question: "Which is a useful way to check an AI answer?", options: ["Ask for assumptions and independently confirm key claims", "Ask it to promise it is true", "Ignore contradictory evidence", "Treat confident language as proof"], answer: 0 },
  { question: "What is one limitation of AI-generated code?", options: ["It can contain bugs or security issues and needs testing", "It is always secure", "It never needs review", "It cannot be edited"], answer: 0 },
  { question: "Which information is generally safest to use in a public AI prompt?", options: ["A real customer's password", "Public, non-sensitive information needed for the task", "An unreleased company secret", "Someone's private medical record"], answer: 1 },
  { question: "What is the best overall mindset for using AI at work or study?", options: ["Use it as an assistant, verify important outputs, and apply human judgement", "Believe every response", "Avoid learning how it works", "Share all private information"], answer: 0 }
];

module.exports = { aiCourseQuestions };
