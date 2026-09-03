# $100 Referral Outreach Runbook

## Purpose

This runbook prepares a proof-first social campaign inviting people to join through a
referral link. It does not publish posts, send direct messages, enroll participants, or
issue rewards. A campaign owner must supply the verified offer terms and approve every
post before publication.

The machine-readable companion is
[`artifacts/social-outreach-100-referral.json`](../artifacts/social-outreach-100-referral.json).

## Required campaign facts

Do not publish until all placeholders have verified values:

| Placeholder | Required evidence |
| --- | --- |
| `{{REFERRAL_LINK}}` | The public HTTPS enrollment URL, checked for the correct owner and destination. |
| `{{OFFER_TERMS_URL}}` | Public rules explaining eligibility, qualifying action, reward form, timing, limits, geography, and expiration. |
| `{{SPONSOR_NAME}}` | The legal or public identity responsible for the offer. |
| `{{DISCLOSURE}}` | A clear statement that the poster may receive a referral benefit. |
| `{{SUPPORT_CONTACT}}` | A monitored contact for eligibility and reward questions. |

The phrase “get $100” must only be used when the terms prove that every person addressed
will receive exactly $100 merely by joining. Otherwise use the qualified language below.

## Approved core message

> Interested in joining {{SPONSOR_NAME}}? Eligible new participants can receive a $100
> reward after completing the qualifying steps in the official terms. Review eligibility,
> deadlines, limits, and reward timing before joining: {{OFFER_TERMS_URL}}. If it fits,
> use my referral link: {{REFERRAL_LINK}}. {{DISCLOSURE}}

Short version:

> Eligible new participants may receive a $100 reward after completing the offer terms:
> {{OFFER_TERMS_URL}}. Join through {{REFERRAL_LINK}}. {{DISCLOSURE}}

## Channel plan

Use native formatting rather than posting an identical message everywhere.

| Channel | Format | Adaptation |
| --- | --- | --- |
| X and Bluesky | Short post or two-post thread | Use the short version; put terms and disclosure in the first post when space permits. |
| Threads | Short post | Use the short version and answer questions with the official terms, not improvised promises. |
| Facebook | Page or profile post | Use the core message; add a link preview for the terms. Do not post repeatedly to unrelated groups. |
| Instagram | Feed, Story, or Reel caption | State “eligibility and terms apply” on the visual and include a working terms/link path in the caption or profile. |
| LinkedIn | Personal or organization post | Use the core message and identify the sponsor and referral relationship. |
| TikTok | Short video and caption | Say the qualification and disclosure aloud; show the terms URL on screen and in the caption. |
| YouTube | Short or community post | Put qualification and disclosure in the content and place both links in the description. |
| Reddit | Relevant community post | Post only where referrals are allowed, follow community flair rules, and disclose the referral benefit at the start. |
| Discord and Slack | Opt-in community announcement | Use only approved promotion channels; never mass-DM members. |
| Email or SMS | Existing opt-in audience only | Include sender identity, terms, disclosure, and an unsubscribe path; do not upload scraped contacts. |

## Approval and publication workflow

1. The campaign owner fills every placeholder in the companion artifact.
2. A reviewer opens the referral and terms links and records the review timestamp.
3. A reviewer confirms the exact $100 reward, qualification, geography, expiration,
   reward timing, and referral disclosure against the terms.
4. The owner checks each platform's current advertising, promotion, and referral rules.
5. The owner adapts and previews each post without weakening the qualification or
   disclosure.
6. A human marks that channel `approved`; publication remains a manual action.
7. The owner records the public post URL and publication time in the proof trail.
8. The owner pauses posts promptly if the terms change, the offer expires, or support
   cannot fulfill verified rewards.

## Guardrails

- Do not buy followers, automate unsolicited replies, mass-DM, or post to unrelated
  communities.
- Do not imply that SkyGrid operates, guarantees, or funds the offer unless verified
  evidence supports that claim.
- Do not collect passwords, wallet secrets, API keys, payment credentials, or identity
  documents through social messages.
- Do not shorten or cloak the terms link in a way that obscures its destination.
- Treat gas budgets, token-space plans, and resource activation drafts as planning data,
  never as proof that a financial reward has been funded or paid.
- Follow applicable platform rules and local advertising, privacy, anti-spam, and tax
  requirements; obtain qualified review where needed.

## Proof record

For each approved post, retain:

- final copy and media checksum,
- campaign owner and approver,
- terms version and review timestamp,
- platform and account,
- scheduled and actual publication timestamps,
- public post URL,
- pause or removal reason, if any,
- aggregate results without secret or unnecessary personal data.

