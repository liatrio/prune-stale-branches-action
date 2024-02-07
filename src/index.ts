import * as core from '@actions/core'
import Day, { Dayjs } from 'dayjs'
import { GitHubUtil } from './GitHubUtil.js'
import { logger } from './Logger.js'
import { ActionsInput } from './types.js'

/**
 * Gets the input value with the given name and converts it to an instance of {@link Dayjs}. This is
 * used on input values that are expected to be in the format of "<value> <unit>", such as
 * "30 days". The resulting `Dayjs` instance is the date that is the given number of units before
 * the current date.
 *
 * For example, providing `30 days` as the input value will return a `Dayjs` instance representing
 * the date 30 days ago.
 *
 * @param inputName The name of the input to get the value for.
 *
 * @returns An instance of `Dayjs` representing the input value.
 */
function getInputAsDate(inputName: string): Dayjs {
  const inputValue = core.getInput(inputName).split(' ')

  if (inputValue.length !== 2) {
    core.setFailed(`Invalid ${inputName} input. Must be in the format of "<value> <unit>".`)

    throw new Error(`The ${inputName} input is in an invalid format.`)
  }

  const number = Number(inputValue[0])
  const unit = inputValue[1] as Day.ManipulateType

  return Day().subtract(number, unit)
}

function getActionsInput(): ActionsInput {
  const branchCutoffDate = getInputAsDate('stale-branch-age')
  const issueCutoffDate = getInputAsDate('stale-branch-issue-age')
  const token = core.getInput('github-token')

  return { branchCutoffDate, token, issueCutoffDate }
}

async function run() {
  const { branchCutoffDate, issueCutoffDate, token } = getActionsInput()

  const gh = new GitHubUtil(token)

  const flaggedBranches = await gh.getFlaggedBranches(branchCutoffDate)

  core.debug(`Found ${flaggedBranches.length || 0} branches that are flagged for deletion.`)

  for (const branch of flaggedBranches) {
    core.debug(`Processing flagged branch: ${branch.branchName}`)

    const issue = await gh.findFlaggedBranchIssue(branch)

    if (issue) {
      core.debug(`Found deletion issue: ${issue.title}; ${issue.html_url}`)

      const creationDate = Day(issue.created_at)

      // Check if the issue was created after the issue cutoff date.
      if (issueCutoffDate.isAfter(creationDate)) {
        // Delete the branch.
        const delRes = await gh.deleteBranch(branch)

        logger.success(`Deleted flagged branch: ${branch.branchName}`, 'index#run')

        logger.success(JSON.stringify(delRes?.data, null, 2), 'index#run')
      } else {
        logger.info(
          `Issue has not been open for required amount of time. Skipping branch deletion: ${branch.branchName}`,
          'index#run',
        )
      }
    } else {
      core.debug('No deletion issue found for flagged branch.')

      const newIssue = await gh.createIssue(branch, issueCutoffDate)

      logger.success(
        `Created issue for flagged branch: ${newIssue?.data?.title || 'Unknown'}`,
        'index#run',
      )
      logger.success(`You can view the issue at: ${newIssue?.data?.html_url}`, 'index#run')
    }
  }

  logger.success('Action completed successfully!', 'index#run')
}

run().catch(err => {
  if (err instanceof Error) core.setFailed(err.message)

  core.setFailed('An error occurred, check logs for more information.')
})

