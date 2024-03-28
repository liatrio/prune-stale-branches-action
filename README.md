# Prune Stale Branches GitHub Action

This repository is home to a GitHub Action that can be used to prune/cleanup stale/unused branches in a repository.

Pruning/cleaning up stale branches reduces overall cognitive overhead. This falls directly in line with the Engineering Defaults defined in [openo11y.dev][0].

## Sample Usage

To use this action in your repository/repositories, simply add a workflow that'll call this action and provide the necessary inputs/config values.

For example, the following snippet is a workflow that will run the Prune Stale Branches Action once day at midnight (`cron: 0 0 * * *`) or whenever manually triggered (`workflow_dispatch`):

```yaml
name: Find & Prune Stale Branches

on:
  workflow_dispatch: {}
  schedule:
    - cron: 0 0 * * *

jobs:
  prune-stale-branches:
    runs-on: ubuntu-latest
    steps:
      - uses: liatrio/github-action-cleanup-stale-branches@v0.6.0
        name: Run Prune Stale Branches Action
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          stale-branch-age: 1 month
          stale-branch-issue-age: 7 days
```

## Reason for Creation

Reducing technical debt and cognitive overhead is essential for effective engineering.
Having tons of stale branches that have diverged from trunk is in-itself technical debt.
This stale action will automatically delete them if not addressed.

> Is 1000 open branches indicative of a poor engineering experience? Yes.
>
> One valid opinion on this is to reduce cognitive overhead and by running automation regularly to cleanup branches in the remote. We should POC a bot that:
>
> 1. automatically runs against n number of repos
> 2. checks the time they've been open
> 3. notifies a slack channel that a list of branches having been open longer than the given time are about to be deleted
> 4. deletes them if no

[0]: https://openo11y.dev
