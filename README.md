# Project O11y Slack Bot POC

This repo is home to a Proof of Concept (POC) for [Project O11y][1] that demonstrates how you would set up a Slack bot that uses the GitHub API to help clean up old repos and make sure it's all instrumented and monitored with OpenTelemetry.

## Source

The reason for creating this POC is because of [issue #25][0] of Project O11y. The details of that ask are as follows:

> Is 1000 open branches indicative of a poor engineering experience? Yes.
>
> One valid opinion on this is to reduce cognitive overhead and by running automation regularly to cleanup branches in the remote. We should POC a bot that:
>
> 1. automatically runs against n number of repos
> 2. checks the time they've been open
> 3. notifies a slack channel that a list of branches having been open longer than the given time are about to be deleted
> 4. deletes them if no

## MVP Requirements

In order to be considered ready for MVP status the following must be true:

- [ ] The functionality can all be run via a GitHub action.
  - [ ] It should be easy to add this action to a workflow for any repo.
- [ ] When the action runs it should check for branches that are older than a certain age and flag them for deletion.
- [ ] If a branch is flagged for deletion, it should create an issue on that repo stating it'll be deleted in x days.
- [ ] If the issue is created, and the config specifies, it should apply any tags or other metadata to the issue for easier tracking & triage.

[0]: https://github.com/liatrio/liatrio-tag-o11y/issues/25
[1]: https://openo11y.dev
