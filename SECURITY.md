# Security Policy

The security of UniSat Wallet and the safety of our users are important to us. We welcome good-faith security research and appreciate researchers who help us identify and resolve potential vulnerabilities responsibly.

This policy explains which versions are supported, how to report a potential vulnerability, what information to include, how we handle reports, and the boundaries for authorized security research.

## Scope

This policy primarily covers the official UniSat Wallet repository and the latest official release of UniSat Wallet.

If you believe a vulnerability affects another UniSat product, service, website, API, or integration, please report it privately through the channels described in this policy. We will review the report and confirm whether the affected component is within scope.

Vulnerabilities affecting third-party systems outside UniSat's control are generally out of scope. However, we may still review a report if it demonstrates a direct and meaningful security risk to UniSat users or their assets.

## Supported Versions

Security updates are generally provided for the latest publicly released version of UniSat Wallet.

| Version | Supported |
| --- | --- |
| Latest official stable release | Yes |
| Previous official releases | Case by case |
| Development, test, preview, or unofficial builds | No general guarantee |

Users and researchers should confirm whether an issue is still present in the latest official release before submitting a report.

## Reporting a Security Vulnerability

Please report vulnerabilities privately through one of the following channels:

- GitHub Private Vulnerability Reporting, available through the repository's Security tab
- Email: contact@unisat.io
- Telegram: `@Contact_Unisat`

Do not report suspected security vulnerabilities through public GitHub issues, discussions, pull requests, social media, or any public community channels.

If sensitive files are required, contact us first so that we can arrange an appropriate secure transfer method. Do not transmit vulnerability details, credentials, personal data, private keys, seed phrases, exploit code, or sensitive files through Telegram.

If you are unsure whether an issue is a security vulnerability, report it privately first.

## What to Include

Please provide as much of the following information as possible:

- A clear description of the vulnerability.
- The affected UniSat product, platform, version, repository, commit, URL, or API endpoint.
- The expected behavior and the observed behavior.
- The potential security impact and a realistic attack scenario.
- The attacker capabilities, prerequisites, and user interaction required.
- Complete and repeatable reproduction steps.
- A minimal, non-destructive proof of concept or test case.
- Relevant logs, screenshots, test addresses, transaction IDs, or other supporting evidence.
- Whether the issue has been publicly disclosed or reported elsewhere.
- Whether any testing involved production systems, real users, personal data, or real assets.
- Suggested remediation, if available.

Reports containing only general security concerns, theoretical claims, automated scanner output, or severity assertions without reproducible evidence may require additional information before they can be evaluated.

Please submit materially distinct vulnerabilities as separate reports whenever practical.

## Our Response Process

After receiving a report, UniSat will seek to:

1. Review the submitted information and request clarification where necessary.
2. Attempt to reproduce and validate the reported behavior.
3. Assess exploitability, impact, affected scope, originality, and severity.
4. Develop, test, and release an appropriate remediation when required.
5. Coordinate any public disclosure after affected users have been reasonably protected.

UniSat aims to acknowledge receipt of the report within three business days and to provide an initial assessment or request for additional information within seven business days.

The time required to investigate and remediate an issue depends on its complexity, impact, affected platforms, release requirements, app-store review, and user-upgrade needs. We will aim to keep the reporter informed of meaningful progress.

Submission of a report does not by itself confirm that the reported behavior is a vulnerability or that the reporter's proposed severity classification has been accepted.

## Coordinated Disclosure

Please keep the vulnerability and all related technical information confidential until UniSat confirms that affected users have been reasonably protected or we agree in writing on a disclosure date.

Do not publicly disclose technical details, exploit code, screenshots, transaction data, or other information that could place users or their assets at risk before the issue can be sufficiently investigated and remediated.

## Good-Faith Security Research

We consider security research to be conducted in good faith when it:

- Is performed solely to identify and help remediate security vulnerabilities.
- Uses test accounts, test wallets, researcher-owned devices, and researcher-owned assets wherever possible.
- Avoids harm to users, assets, data, and production availability.
- Accesses only the minimum information necessary to demonstrate the issue.
- Stops immediately if sensitive user information or assets are encountered.
- Reports the issue promptly and privately.
- Allows a reasonable period for investigation and remediation.
- Complies with applicable laws and this policy.

To the extent that UniSat has the authority to do so, we will treat research that complies with this policy as authorized security research and will not initiate legal action for accidental, good-faith violations of this policy, provided that such violations do not involve gross negligence, wilful misconduct, or breach of applicable laws. UniSat reserves the right to pursue all legal remedies for any serious violations of this policy or applicable laws. If a policy concern arises, we will seek to understand and resolve it with the researcher first.

This statement does not authorize activity against third-party systems, does not bind independent third parties, and does not replace applicable law.

## Prohibited Activities

The following activities are not authorized under this policy:

- Accessing, copying, retaining, or disclosing another user's seed phrase, private key, credentials, personal data, or wallet data.
- Transferring, freezing, destroying, or otherwise interfering with assets that do not belong to the researcher.
- Testing with real user accounts, real user assets, or personal data beyond the minimum accidental access necessary to identify the issue.
- Phishing, social engineering, or targeting UniSat users, employees, contractors, or partners.
- Denial-of-service testing or any activity that degrades production services.
- Introducing malware, backdoors, persistent access, or destructive payloads into user or UniSat systems.
- Testing third-party systems or integrations without the relevant owner's authorization.
- Publicly disclosing an unremediated vulnerability without reasonable coordination.
- Selling or providing an unremediated vulnerability to a third party.
- Using threats to users, public disclosure, asset loss, or operational disruption as leverage for payment.
- Making delivery, review, or disclosure of security findings conditional on product integration, investment, employment, advisory work, or unrelated commercial arrangements.

If testing may create a meaningful risk to users, production systems, or real assets, contact us before proceeding.

## Rewards

UniSat may, at its discretion, offer a reward or other recognition for a valid, original, previously unknown vulnerability reported in accordance with this policy.

Reward eligibility and amount are determined only after technical validation. Relevant considerations may include:

- Practical exploitability.
- Potential impact on user assets, sensitive information, or wallet security.
- Affected products, versions, platforms, and users.
- Required attacker capabilities and user interaction.
- Report quality, completeness, and reproducibility.
- Originality and whether the issue was previously known or reported.
- The researcher's compliance with this policy.
- The quality of any remediation assistance provided.

Submitting a report does not automatically create an entitlement to reward. A report does not become eligible merely because the reporter assigns it a particular severity. Any reward offer will be confirmed in writing through an official UniSat security channel.

## Out of Scope

Unless they demonstrate a concrete and previously unrecognized security impact, the following are generally not eligible for a reward:

- Findings affecting unsupported or substantially outdated versions.
- Issues that require an already-compromised operating system, browser, device, or unrestricted local access.
- General statements about memory, storage, cryptography, or architecture without a demonstrated attack path.
- Missing security headers, configuration observations, or general hardening recommendations without practical impact.
- Automated scanner results without manual validation.
- Denial-of-service findings requiring unrealistic resources or sustained high-volume traffic.
- Self-XSS or attacks requiring a user to execute arbitrary attacker-provided code without a credible delivery path.
- Vulnerabilities in third-party services or applications outside UniSat's control.
- Duplicate reports or issues already known to the UniSat team.
- Purely theoretical attacks without realistic evidence of exploitability.
- Reports that do not identify an affected supported UniSat product or version.

An issue initially considered out of scope may still be reviewed if the report demonstrates a meaningful and previously unrecognized risk to UniSat users or their assets.

## Governing Law and Dispute Resolution

Prior to commencing any formal dispute resolution proceedings, the parties shall attempt to resolve any controversy, claim, or dispute arising out of or relating to this policy through good-faith, confidential negotiations via email sent to contact@unisat.io. If the dispute cannot be resolved within thirty (30) days after the initial email is sent, either party may proceed to arbitration as set forth below.

This policy and any dispute, claim, or controversy arising out of or in connection with it shall be governed by and construed in accordance with the laws of the Hong Kong Special Administrative Region of the People's Republic of China ("Hong Kong").

Any such dispute shall be referred to and finally resolved by arbitration administered by the Hong Kong International Arbitration Centre ("HKIAC") under the HKIAC Administered Arbitration Rules in force when the notice of arbitration is submitted. The law of this arbitration clause shall be Hong Kong law. There shall be one (1) arbitrator appointed in accordance with the HKIAC Administered Arbitration Rules. The seat of arbitration shall be Hong Kong, and the language of the arbitration shall be English. The award of the arbitrator shall be final and binding upon the parties.

## Researcher Recognition

For confirmed findings, we are happy to discuss public acknowledgement, subject to:

- The researcher's preference.
- Compliance with this policy.
- Completion of the relevant remediation.
- Agreement on the accuracy and timing of the acknowledgement.

Thank you for helping us improve the security of UniSat Wallet and protect the broader Bitcoin ecosystem.
