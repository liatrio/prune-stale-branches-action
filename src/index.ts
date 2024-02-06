import * as core from '@actions/core'
import Day from 'dayjs'
import { GitHubUtil } from './GitHubUtil.js'
import { logger } from './Logger.js'
import { ActionsInput } from './types.js'

function getActionsInput(): ActionsInput {
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

async function run() {
  try {
    const { cutoffDate, token } = getActionsInput()

    const gh = new GitHubUtil(token)

    const flaggedBranches = await gh.getFlaggedBranches(cutoffDate)

    core.notice(`Flagged Branches Count: ${flaggedBranches.length || 0}`)
    logger.debug(`Flagged Branches Count: ${flaggedBranches.length || 0}`, 'index#run')

    for (const branch of flaggedBranches) {
      core.notice(`Flagged Branch: ${branch.branchName}`)
      logger.debug(`Flagged Branch: ${branch.branchName}`, 'index#run')

      const issue = await gh.findFlaggedBranchIssue(branch)

      if (issue) {
        logger.info(`Found issue for flagged branch: ${issue.title}`, 'index#run')
        logger.info(`Issue body: ${issue.body}`, 'index#run')

        // Since the issue has already been created, we need to check if it's been 3 days since it
        // was created. If so, then we're clear to delete the branch.
        const creationDate = Day(issue.created_at)
        const daysSinceCreation = Day().diff(creationDate, 'day')

        if (daysSinceCreation >= 3) {
          // Delete the branch.
          const delRes = await gh.deleteBranch(branch)

          logger.success(`Deleted flagged branch: ${branch.branchName}`, 'index#run')

          logger.success(JSON.stringify(delRes?.data, null, 2), 'index#run')
        } else {
          logger.info(
            `Issue has not been open for 3 days. Skipping branch deletion: ${branch.branchName}`,
            'index#run',
          )
        }
      } else {
        // Create the new issue for the flagged branch.
        // This issue is used to notify the owners that a branch is set to be deleted.
        const newIssue = await gh.createIssue(branch)

        logger.success(
          `Created issue for flagged branch: ${newIssue?.data?.title || 'Unknown'}`,
          'index#run',
        )
        logger.success('Issue details:', 'index#run')
        logger.success(JSON.stringify(newIssue?.data, null, 2), 'index#run')
      }
    }

    logger.success('Action completed successfully!', 'index#run')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)

    core.setFailed('An error occurred, check logs for more information.')
  }
}

run()
