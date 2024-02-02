import { program } from 'commander'
import Day from 'dayjs'
import PQueue from 'p-queue'
import pc from 'picocolors'
import { GitHub, type BranchAndCommit, type ReposResponse } from './GitHub'
import { logger } from './Logger'
// import inquirer from 'inquirer'

/**
 * Uses the PQueue library to process each repo concurrently. Usually exhausts the rate limit
 * extremely fast so I don't use it.
 *
 * @param input An object containing the various inputs for the command.
 *
 * @returns An array of objects containing the repositories, branches, and their ages.
 */
async function getFlaggedBranchesConcurrently(input: {
  /** The GitHub token to use for authentication. */
  token: string

  /** The owner of the repositories to fetch. */
  owner: string

  /** The type of owner to fetch repositories for. */
  ownerType: 'org' | 'user'

  /** How many months it must be since last commit to flag for deletion. */
  minimumMonths: number

  /** The max number of tasks to run concurrently. */
  concurrency: number
}) {
  const queue = new PQueue({ concurrency: input.concurrency })
  const flaggedBranches: {
    repo: ReposResponse
    branchAndCommit: BranchAndCommit
    branchAge: number
  }[] = []

  try {
    const gh = new GitHub(input.token)

    const repos = await gh.getRepos(input.owner, input.ownerType)

    if (repos) {
      // logger.debug(`${repos.length} repos returned.`, 'index#commandAction')

      for (const repo of repos) {
        // logger.debug(`Batching repo: ${pc.bold(repo.name)}`, 'index#commandAction')

        queue.add(async () => {
          const branchesAndCommits = await gh.getBranchesAndLatestCommit(
            repo.owner.name || input.owner,
            repo.name,
          )

          if (branchesAndCommits) {
            // logger.debug(`${branches.length} branches returned.`, 'index#commandAction')

            for (const branchAndCommit of branchesAndCommits) {
              // logger.debug(`Processing branch: ${pc.bold(branch.branch.name)}`, 'index#commandAction')

              const now = Day()
              const branchDate = Day(branchAndCommit.commit.committer?.date)
              const branchAge = now.diff(branchDate, 'month')

              // logger.debug(`Branch age: ${branchAge} months`, 'index#commandAction')

              if (branchAge > 6) {
                flaggedBranches.push({
                  repo,
                  branchAndCommit,
                  branchAge,
                })
              }
            }
          }
        })
      }
    } else {
      logger.info('No repos returned.', 'index#commandAction')
    }
  } catch (error) {
    logger.error('Error caught when batching flagged branches:', 'index#getFlaggedBranches')
    logger.error(error, 'index#getFlaggedBranches')
  }

  await queue.onIdle()

  return flaggedBranches
}

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
    const gh = new GitHub(input.token)

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

    if (flaggedBranches.length > 0) {
      logger.warn(`${flaggedBranches.length} flagged branches found.`)
    } else {
      logger.success('No flagged branches found.')
    }

    process.exit(0)
  } catch (error) {
    logger.error('Error caught when running command:', 'index#commandAction')
    logger.error(error, 'index#commandAction')

    process.exit(1)
  }
}

try {
  const ownerNameArgument = program
    .createArgument('<owner>', 'The owner of the repositories to fetch.')
    .argRequired()

  const ownerTypeOption = program
    .createOption('-t, --type <type>', 'The type of owner to fetch repositories for.')
    .choices(['org', 'user'])
    .default('org')

  const tokenOption = program
    .createOption('-g, --github-token <token>', 'The GitHub token to use for authentication.')
    .env('GITHUB_TOKEN')
    .makeOptionMandatory()

  const branchAgeArgument = program
    .createArgument(
      '[branch-age]',
      'The minimum age, in months, of the branches to flag for deletion.',
    )
    .default('6')

  const command = program
    .name('o11y-poc')
    .description('A proof of concept CLI for Project O11y.')
    .version('0.0.0')
    .addOption(tokenOption)
    .addOption(ownerTypeOption)
    .addArgument(ownerNameArgument)
    .addArgument(branchAgeArgument)
    .action(async (owner: string, branchAge: string) => await commandAction(owner, branchAge))

  command.parse(process.argv)
} catch (error) {
  logger.error('Error caught when creating command:', 'index')
  logger.error(error, 'index')

  process.exit(1)
}
