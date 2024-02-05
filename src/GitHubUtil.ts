import { getOctokit } from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import { composePaginateRest, paginateRest } from '@octokit/plugin-paginate-rest'
import { type Endpoints } from '@octokit/types'
import { logger } from './Logger'

/** A type that represents an object that contains both a branch and its last commit. */
export type BranchAndCommit = {
  /** The details available for a branch. */
  branch: Endpoints['GET /repos/{owner}/{repo}/branches']['response']['data'][number]

  /** The last commit made to the branch. */
  commit: Endpoints['GET /repos/{owner}/{repo}/commits/{ref}']['response']['data']['commit']
}

/** The response from the GitHub API when fetching repositories. */
export type ReposResponse = Endpoints['GET /orgs/{org}/repos']['response']['data'][number]

/**
 * A class with a few utility methods that simplify interacting with the GitHub REST API and the
 * data it returns.
 */
export class GitHubUtil {
  private gh: InstanceType<typeof GitHub>

  /**
   * Create a new instance of the {@link GitHub} class with the given {@link token} and creates a
   * new instance of the `Octokit` class with the {@link paginateRest} and
   * {@link composePaginateRest} plugins.
   *
   * @param token The GitHub token to use for authentication.
   */
  public constructor(token: string) {
    this.gh = getOctokit(token, paginateRest, composePaginateRest)
  }

  /**
   * Retrieves all of the repositories under the given `username`.
   *
   * @param username The name of the user.
   *
   * @returns All the repositories under the given `username`.
   */
  public async getUserRepos(username: string) {
    try {
      const res = await this.gh.paginate('GET /users/{username}/repos', { username, type: 'owner' })

      if (res.length === 0) {
        logger.error(`res: ${JSON.stringify(res, null, 2)}`, `GitHub#getUserRepos`)

        throw new Error('Invalid response from GitHub')
      } else return res
    } catch (error) {
      logger.error(`Error caught when getting repos for user ${username}:`, `GitHub#getUserRepos`)
      logger.error(error)

      return undefined
    }
  }

  /**
   * Retrieves all of the repositories under the given `org`.
   *
   * @param org The name of the organization.
   *
   * @returns All the repositories under the given `org`.
   */
  public async getOrgRepos(org: string) {
    try {
      const res = await this.gh.paginate('GET /orgs/{org}/repos', { org, type: 'all' })

      if (res.length === 0) {
        logger.error(
          `No repos found for org ${org}: ${JSON.stringify(res, null, 2)}`,
          `GitHub#getOrgRepos`,
        )

        return undefined
      } else return res
    } catch (error) {
      logger.error(`Error caught when getting repos for org ${org}:`, `GitHub#getOrgRepos`)
      logger.error(error)

      return undefined
    }
  }

  /**
   * Retrieves all of the repositories under a given owner, either an organization or a user, and
   * returns them via a Promise.
   *
   * @param owner The owner of the repository.
   * @param ownerType The type of the owner. Either 'org' or 'user'.
   *
   * @returns All the repositories under the given `owner`.
   */
  public async getRepos(owner: string, ownerType: 'org' | 'user' = 'org') {
    try {
      switch (ownerType) {
        case 'org':
          return await this.getOrgRepos(owner)
        case 'user':
          return await this.getUserRepos(owner)
      }
    } catch (error) {
      logger.error(`Error caught when getting repos for ${ownerType} ${owner}:`, `GitHub#getRepos`)
      logger.error(error)

      return undefined
    }
  }

  /**
   * Retrieve all the branches present in a repository, along with their last commit so we have age
   * information.
   *
   * @param owner The owner of the repository.
   * @param repo The name of the repository.
   */
  public async getBranchesAndLatestCommit(owner: string, repo: string) {
    const branchesAndCommits: BranchAndCommit[] = []

    try {
      const response = await this.gh.paginate('GET /repos/{owner}/{repo}/branches', { owner, repo })

      if (response.length === 0) {
        logger.info(`${owner}/${repo} is an empty repository.`, `GitHub#getBranches`)

        return undefined
      }

      for (const branch of response) {
        // const commit = await this.gh.repos.getCommit({ owner, repo, ref: branch.commit.sha })
        const commit = await this.gh.request('GET /repos/{owner}/{repo}/commits/{ref}', {
          owner,
          repo,
          ref: branch.commit.sha,
        })

        branchesAndCommits.push({ branch: branch, commit: commit.data.commit })
      }
    } catch (error) {
      logger.error(`Error caught when getting branches for repo ${repo}:`, `GitHub#getBranches`)
      logger.error(error)
    }

    return branchesAndCommits
  }

  public async getFlaggedBranches(branches: BranchAndCommit[], monthLimit: number) {}
}
