import { context } from '@actions/github'
import { type Endpoints } from '@octokit/types'
import { Dayjs } from 'dayjs'

export type FlaggedBranch = {
  repo: typeof context.repo
  branchName: string
  lastCommitDate: Dayjs
}

export type ActionsInput = {
  /**
   * The date that is the cutoff for when a branch is considered stale. Any branch that has not had
   * any activity (commits) since this date is considered stale and will be flagged for deletion.
   */
  branchCutoffDate: Dayjs

  /**
   * When a branch is flagged for deletion and an issue is created to notify the owners, this is the
   * date that is used to determine when the branch can be deleted. If the issue has been open for
   * longer than this date, then the branch can be deleted.
   */
  issueCutoffDate: Dayjs

  /** The personal access token used for authenticating with the GitHub API. */
  token: string
}

export type BranchAndCommit = {
  /** The details available for a branch. */
  branch: Endpoints['GET /repos/{owner}/{repo}/branches']['response']['data'][number]

  /** The last commit made to the branch. */
  commit: Endpoints['GET /repos/{owner}/{repo}/commits/{ref}']['response']['data']['commit']
}

/** The response from the GitHub API when fetching issues. */
export type IssuesResponse =
  Endpoints['GET /repos/{owner}/{repo}/issues']['response']['data'][number]

/** The response from the GitHub API when fetching repositories. */
export type ReposResponse = Endpoints['GET /orgs/{org}/repos']['response']['data'][number]
