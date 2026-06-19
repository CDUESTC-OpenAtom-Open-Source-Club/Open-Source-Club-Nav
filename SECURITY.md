# Security Policy

## Reporting A Vulnerability

Do not report security vulnerabilities in public issues.

Use GitHub Security Advisories if available, or contact the maintainers privately through the organization maintainers.

Include:

- Affected component or endpoint.
- Reproduction steps.
- Impact assessment.
- Any relevant logs, screenshots, or proof of concept.

## Scope

In scope:

- Authentication and authorization flaws.
- Secret exposure.
- Server-side request forgery or unsafe outbound requests.
- SQL injection or unsafe database access.
- Cross-site scripting or unsafe frontend rendering.
- Deployment scripts that expose production credentials or allow unauthorized access.

Out of scope:

- Social engineering.
- Denial-of-service testing without maintainer approval.
- Reports requiring physical access to maintainer devices.
- Vulnerabilities in third-party services unless the project configuration directly causes the issue.

## Maintainer Response

Maintainers should acknowledge valid reports, assess severity, prepare a fix privately when needed, and publish a security note after remediation.
