# TrueTerms

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

User specified: Next.js 14, TypeScript, App Router, Tailwind CSS. One page with Home, Upload, and Results managed through client state.

## Users

Newly arrived workers checking their signed employment contract against their original job offer. Language choices: English, Urdu, Hindi, Bengali.

## Product Purpose

Show differences from the original offer, explain them in the user's language, and route the user to MOHRE or ADGM. AGENTS.md owns the project's hard rules.

## Capabilities and Constraints

The app provides language selection, JPG/PNG file inputs, server-side structured extraction with the OpenAI Responses API, deterministic comparison of nine employment terms, and a results table. Live extraction uses gpt-6-astra and requires OPENAI_API_KEY in the server environment. Translations, rule cards, and authority routing are pending later tasks.

The hard-coded demo offer and contract differ only in job title (Electrician versus General Helper) and monthly salary (AED 2000 versus AED 1200). Weekly hours, annual leave, and work location match. Unspecified terms are null and shown as Not found.

The sample path must work with hard-coded data and zero API calls. No chat, sidebar, or login. Every screen shows the exact footer specified in AGENTS.md.
