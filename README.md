# Project O11y Stale Branch POC

This repository is home to a GitHub Action that can be used to clean up stale/unused branches in a repository and it will also be instrumented with OpenTelemetry. It started as a Proof of Concept (POC) for [Project O11y][0] that has since turned into a full fledged action.

## Sample Usage

To use this action in your repository/repositories, you simply need a workflow that'll call this action and provide the necessary inputs/config values.

For example, the following snippet is a workflow that will run the stale branch action once every 6 hours or whenever manually triggered:

```yaml
name: Check for Stale Branches

on:
  workflow_dispatch: {}
  schedule:
    - cron: '0 */6 * * *'

jobs:
  find-stale-branches:
    runs-on: ubuntu-latest
    name: Find And Process Stale Branches

    steps:
      - name: Run Stale Branch Action
        id: stale-branch-poc
        uses: liatrio/o11y-stale-branch-poc@v0.2.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          stale-branch-age: '3 months'
          stale-branch-issue-age: '7 days'
```

## Reason for Creation

The reason for creating this POC is because of [issue #25][1] of Project O11y. The details of that ask are as follows:

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
- [ ] The minimum branch age should be able to be provided as a parameter like `<amount> <unit>`
  - [ ] E.g. `30 days`, `2 weeks`
- [ ] When the action runs it should check for branches that are older than a certain age and flag them for deletion.
- [ ] If a branch is flagged for deletion, it should create an issue on that repo stating it'll be deleted in x days.
- [ ] If the issue is created, and the config specifies, it should apply any tags or other metadata to the issue for easier tracking & triage.

[0]: https://openo11y.dev
[1]: https://github.com/liatrio/liatrio-tag-o11y/issues/25
