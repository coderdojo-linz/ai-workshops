# IT-Forensics: The Data Thief in Our Company

Target Group: Young kids (age 9–12), beginners, no coding experience.

This exercise trains kids to ask good questions to an AI assistant (Nova) and to use data as evidence. They explore login logs to spot brute-force attempts and impossible travel.

## Materials

- Kids Guide: `exercises/02-detective-beginners/guides/kids.md`
- Mentor Guide: `exercises/02-detective-beginners/guides/mentor.md`
- Datasets:
  - `exercises/02-detective-beginners/dataset/login_with_brute_force_and_impossible_travel.csv`
  - `exercises/02-detective-beginners/dataset/login_impossible_travel_clean.csv`

## Story

In a fictional company, a villain wants to sell secret research data. Participants get access to login logs and use the AI chatbot to identify a suspicious user (e.g., many failed logins followed by a successful one, or logins from distant cities in a short time).

## Tools

- AI chatbot (Open WebUI)

## Mentor Quick Start

1. Set the frame: Kids ask Nova in small steps; Nova explains only on demand.
2. Skim the data: Show 5–10 rows; name columns (`time, user, result, city, device, action, download_size`).
3. Guide hypotheses: Many `fail` before `success` (brute force); far-apart cities in short time (impossible travel).
4. Collect evidence: Tables and simple charts (bar chart for `fail` vs `success` per user; timeline/map for travel anomalies).
5. Decision: “Who is suspicious, and why?” One or two visuals to justify.

## Learning Objective

Introduction to the world of IT security and the importance of data analysis in solving (digital) criminal cases.
