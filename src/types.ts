import { type Endpoints } from '@octokit/types'
import { context } from '@actions/github'
import { Dayjs } from 'dayjs'

export type FlaggedBranch = {
  repo: typeof context.repo
  branchName: string
  lastCommitDate: Dayjs
}

export type ActionsInput = {
  cutoffDate: Dayjs
  token: string
}

export type BranchAndCommit = {
  /** The details available for a branch. */
  branch: Endpoints['GET /repos/{owner}/{repo}/branches']['response']['data'][number]

  /** The last commit made to the branch. */
  commit: Endpoints['GET /repos/{owner}/{repo}/commits/{ref}']['response']['data']['commit']
}

/** The response from the GitHub API when fetching issues. */
export type IssuesResponse = Endpoints['GET /repos/{owner}/{repo}/issues']['response']['data'][number]

/** The response from the GitHub API when fetching repositories. */
export type ReposResponse = Endpoints['GET /orgs/{org}/repos']['response']['data'][number]


