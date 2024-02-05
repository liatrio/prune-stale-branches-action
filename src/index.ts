import * as core from '@actions/core'
import { context } from '@actions/github'
import Day from 'dayjs'
import { GitHubUtil } from './GitHubUtil.js'
import { logger } from './Logger.js'

type FlaggedBranch = {
  repoName: string
  branchName: string
  lastCommitDate: Day.Dayjs
}

function getActionsInput() {
  const staleBranchAgeInput = core.getInput('stale-branch-age')
  const staleBranchAgeSplit = staleBranchAgeInput.split(' ')

  if (staleBranchAgeSplit.length !== 2) {
    core.setFailed(
      'Invalid stale-branch-age input. Must be in the format of "<value> <unit>". Eg: "30 days".',
    )

    throw new Error('Invalid stale-branch-age input.')
  }

  const staleBranchAge = {
    number: Number(staleBranchAgeSplit[0]),
    unit: staleBranchAgeSplit[1] as Day.ManipulateType,
  }

  logger.debug(`Parsed staleBranchAge: ${JSON.stringify(staleBranchAge, null, 2)}`, 'index#run')

  /**
   * The date that determines how long a branch must go without activity to be considered stale.
   */
  const cutoffDate = Day().subtract(staleBranchAge.number, staleBranchAge.unit)

  /** The personal access token used for authenticating with the GitHub API. */
  const token = core.getInput('github-token')

  return { cutoffDate, token }
}

async function getFlaggedBranches() {
  const flaggedBranches: FlaggedBranch[] = []

  try {
    const { cutoffDate, token } = getActionsInput()

    /** An instance the GitHub utility class for interacting with the GitHub API. */
    const gh = new GitHubUtil(token)

    const branchesAndCommits = await gh.getBranchesAndLatestCommit(
      context.repo.owner,
      context.repo.repo,
    )

    if (branchesAndCommits && branchesAndCommits.length > 0) {
      logger.debug(`${branchesAndCommits.length} branches found.`, 'index#getFlaggedBranches')

      for (const branch of branchesAndCommits) {
        logger.debug(`Processing branch: ${branch.branch.name}`, 'index#getFlaggedBranches')

        const lastCommitDate = Day(branch.commit.committer?.date)

        // Verify the `lastCommitDate` is valid and after the `cutoffDate`.
        if (lastCommitDate.isValid() && cutoffDate.isAfter(lastCommitDate)) {
          logger.success(`Found a stale branch: ${branch.branch.name}`, 'index#getFlaggedBranches')
          logger.success(`Last commit date: ${lastCommitDate.format('YYYY-MM-DD')}`, 'index#getFlaggedBranches')
          logger.success(`Cutoff date: ${cutoffDate.format('YYYY-MM-DD')}`, 'index#getFlaggedBranches')

          flaggedBranches.push({
            repoName: context.repo.repo,
            branchName: branch.branch.name,
            lastCommitDate,
          })
        }
      }
    }
  } catch (error) {
    logger.error('An error occurred while getting flagged branches:', 'index#getFlaggedBranches')
    logger.error(error)
  }

  return flaggedBranches
}

async function run() {
  try {
    const flaggedBranches = await getFlaggedBranches()

    core.notice(`Flagged Branches Count: ${flaggedBranches.length || 0}`)
    logger.debug(`Flagged Branches Count: ${flaggedBranches.length || 0}`, 'index#run')

    if (flaggedBranches.length > 0) {
      for (const branch of flaggedBranches) {
        core.notice(`Flagged Branch: ${branch.branchName}`)
        logger.debug(`Flagged Branch: ${branch.branchName}`, 'index#run')
      }
    }

    core.info('Action completed successfully!')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)

    core.setFailed('An error occurred, check logs for more information.')
  }
}

run()
