import * as core from '@actions/core'
import { context } from '@actions/github'
import { program } from 'commander'
import Day from 'dayjs'
import pc from 'picocolors'
import { GitHubUtil, type BranchAndCommit, type ReposResponse } from './GitHubUtil.js'
import { logger } from './Logger.js'

/**
 * Gets all of the repositories for the given owner and owner type, then gets all of the branches
 * for each repository and their latest commit. It then calculates the age of each branch and flags
 * it for deletion if it is older than the given number of months. If the branch is flagged, it is
 * added to an array of flagged branches that is then returned.
 *
 * @param input All of the command inputs.
 *
 * @returns An array of objects containing the repositories, branches, and their ages.
 */
async function getFlaggedBranches(input: {
  /** The GitHub token to use for authentication. */
  token: string

  /** The owner of the repositories to fetch. */
  owner: string

  /** The type of owner to fetch repositories for. */
  ownerType: 'org' | 'user'

  /** How many months it must be since last commit to flag for deletion. */
  minimumMonths: number
}) {
  const flaggedBranches = []

  try {
    const gh = new GitHubUtil(input.token)

    const repos = await gh.getRepos(input.owner, input.ownerType)

    if (repos) {
      logger.debug(`${repos.length} repos returned.`, 'index#commandAction')

      for (const repo of repos) {
        logger.debug(`Processing repo: ${pc.bold(repo.name)}`, 'index#commandAction')

        const branches = await gh.getBranchesAndLatestCommit(
          repo.owner.name || input.owner,
          repo.name,
        )

        if (branches) {
          logger.debug(`${branches.length} branches returned.`, 'index#commandAction')

          for (const branch of branches) {
            logger.debug(`Processing branch: ${pc.bold(branch.branch.name)}`, 'index#commandAction')

            const now = Day()
            const branchDate = Day(branch.commit.committer?.date)
            const branchAge = now.diff(branchDate, 'month')

            logger.debug(`Branch age: ${branchAge} months`, 'index#commandAction')

            if (branchAge > input.minimumMonths) {
              flaggedBranches.push({
                repoName: repo.name,
                branchName: branch.branch.name,
                branchAge,
              })
            }
          }
        }
      }
    } else {
      logger.info('No repos returned.', 'index#commandAction')
    }
  } catch (error) {
    logger.error('Error caught when getting flagged branches:', 'index#getFlaggedBranches')
    logger.error(error, 'index#getFlaggedBranches')
  }

  return flaggedBranches
}

async function commandAction(owner: string, branchAge: string) {
  try {
    const opts = program.opts()

    const ownerType: 'org' | 'user' = opts.type
    const ghToken: string = opts.githubToken

    const flaggedBranches = await getFlaggedBranches({
      token: ghToken,
      owner,
      ownerType,
      minimumMonths: Number(branchAge),
    })

    if (flaggedBranches.length > 0) logger.warn(`${flaggedBranches.length} flagged branches found.`)
    else logger.success('No flagged branches found.')

    process.exit(0)
  } catch (error) {
    logger.error('Error caught when running command:', 'index#commandAction')
    logger.error(error, 'index#commandAction')

    process.exit(1)
  }
}

export async function run(): Promise<void> {
  try {
    /**
     * A string like in the format of `<number> <unit>` like "30 days" that determines how long a
     * branch must go without activity to be considered stale.
     */
    const staleBranchAge: string = core.getInput('stale-branch-age')

    /** The personal access token used for authenticating with the GitHub API. */
    const token: string = core.getInput('github-token')

    const gh = new GitHubUtil(token)

    const branchesAndCommits = await gh.getBranchesAndLatestCommit(context.repo.owner, context.repo.repo)

    core.setOutput('branches-and-commits', JSON.stringify(branchesAndCommits))
    core.setOutput('stale-branch-age', staleBranchAge)
    core.setOutput('branches-count', branchesAndCommits?.length || 0)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)

    core.setFailed('An error occurred, check logs for more information.')
  }
}
