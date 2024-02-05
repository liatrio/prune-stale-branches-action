import * as core from '@actions/core'
import { context } from '@actions/github'
import { GitHubUtil } from './GitHubUtil.js'

try {
  /**
   * A string like in the format of `<number> <unit>` like "30 days" that determines how long a
   * branch must go without activity to be considered stale.
   */
  const staleBranchAge: string = core.getInput('stale-branch-age')

  /** The personal access token used for authenticating with the GitHub API. */
  const token: string = core.getInput('github-token')

  const gh = new GitHubUtil(token)

  const branchesAndCommits = await gh.getBranchesAndLatestCommit(
    context.repo.owner,
    context.repo.repo,
  )

  core.setOutput('branches-and-commits', JSON.stringify(branchesAndCommits))
  core.setOutput('stale-branch-age', staleBranchAge)
  core.setOutput('branches-count', branchesAndCommits?.length || 0)

  core.info('Action completed successfully!')

  core.info(`Stale Branch Age: ${staleBranchAge}`)
  core.info(`Branches Count: ${branchesAndCommits?.length || 0}`)
} catch (error) {
  if (error instanceof Error) core.setFailed(error.message)

  core.setFailed('An error occurred, check logs for more information.')
}
