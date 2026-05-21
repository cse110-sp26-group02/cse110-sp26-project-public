/**
 * @summary
 * This file contains helper functions for retrieval/modification of milestones from GitHub. 
 * @summary
 * 1st implementation
 * @summary
 * Functions Declared:
 * - buildRepositoryMilestonesPath
 * - buildRepositoryMilestonePath
 * - validateOwnerRepo
 * - validateOwnerRepoMilestoneNumber
 * - isPlainObject
 * - isValidMilestoneState
 * - isValidMilestoneDueOn
 * - normalizeMilestoneState
 * - normalizeMilestoneDueOn
 * - normalizeCreateMilestonePayload
 * - normalizeUpdateMilestonePayload
 * 
 * @todo N/A
**/

/* imports */

// universal GitHub issue helpers
import {
  
    buildLocalValidationError,
    encodePathPart,
    requireFields
  
} from "../all/gh_api_help.js";

// GitHub milestone states 
export const VALID_MILESTONE_STATES = Object.freeze(
    [
        "open",
        "closed"
    ]
);

/**
 * @summary
 * Builds the path for repository milestones.
 * @summary
 * Internal helpers used:
 * - encodePathPart
 *
 * @param {string} owner Repository owner.
 * @param {string} repo Repository name.
 * 
 * @returns {string} GitHub API path.
 */
export function buildRepositoryMilestonesPath(
    owner,
    repo
)
{

    return `/repos/${encodePathPart(owner)}/${encodePathPart(repo)}/milestones`;

}

/**
 * @summary
 * Builds the path for one repository milestone.
 * @summary
 * Internal helpers used:
 * - buildRepositoryMilestonesPath
 * - encodePathPart
 *
 * @param {string} owner Repository owner.
 * @param {string} repo Repository name.
 * @param {number|string} milestoneNumber Milestone number.
 * 
 * @returns {string} GitHub API path.
 */
export function buildRepositoryMilestonePath(
    owner,
    repo,
    milestoneNumber
)
{

    return `${buildRepositoryMilestonesPath(owner, repo)}/${encodePathPart(milestoneNumber)}`;

}

/**
 * @summary
 * Validates repository owner and repository name fields.
 * @summary
 * Internal helpers used:
 * - requireFields
 *
 * @param {string} owner Repository owner.
 * @param {string} repo Repository name.
 * 
 * @returns {Object|null} Validation error response or null.
 */
export function validateOwnerRepo(
    owner,
    repo
)
{

    return requireFields(
        {
            owner,
            repo
        }
    );

}

/**
 * @summary
 * Validates repository owner, repository name, and milestone number fields.
 * @summary
 * Internal helpers used:
 * - requireFields
 *
 * @param {string} owner Repository owner.
 * @param {string} repo Repository name.
 * @param {number|string} milestoneNumber Milestone number.
 * 
 * @returns {Object|null} Validation error response or null.
 */
export function validateOwnerRepoMilestoneNumber(
    owner,
    repo,
    milestoneNumber
)
{

    return requireFields(
        {
            owner,
            repo,
            milestoneNumber
        }
    );

}

/**
 * @summary
 * Checks whether a value is a plain object.
 * @summary
 * Internal helpers used:
 * - none
 *
 * @param {*} value Value to check.
 * 
 * @returns {boolean} True when the value is a non-array object.
 */
export function isPlainObject(
    value
)
{

    return Boolean(
        value
    ) &&
    typeof value === "object" &&
    !Array.isArray(
        value
    );

}

/**
 * @summary
 * Checks whether a milestone state is valid.
 * @summary
 * GitHub milestone state values are open and closed.
 * @summary
 * Internal helpers used:
 * - none
 *
 * @param {*} value State value to check.
 * 
 * @returns {boolean} True when the value is a valid milestone state.
 */
export function isValidMilestoneState(
    value
)
{

    return VALID_MILESTONE_STATES.includes(
        value
    );

}

/**
 * @summary
 * Checks whether a value looks like an ISO 8601 UTC timestamp.
 * @summary
 * GitHub documents due_on as a timestamp in YYYY-MM-DDTHH:MM:SSZ format.
 * This helper performs local format validation only; GitHub remains the source
 * of truth for final validation.
 * @summary
 * Internal helpers used:
 * - none
 *
 * @param {*} value Timestamp value to check.
 * 
 * @returns {boolean} True when the value matches the expected timestamp shape.
 */
export function isValidMilestoneDueOn(
    value
)
{

    return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(
        value
    );

}

/**
 * @summary
 * Normalizes and validates milestone state.
 * @summary
 * Allows undefined when state is optional. Rejects invalid state strings.
 * @summary
 * Internal helpers used:
 * - isValidMilestoneState
 * - buildLocalValidationError
 *
 * @param {*} state Milestone state.
 * @param {string} [fieldName="state"] Field name for error messages.
 * 
 * @returns {Object} Object with ok/value or normalized validation error.
 */
export function normalizeMilestoneState(
    state,
    fieldName = "state"
)
{

    if (
        state === undefined
    )
    {

        return {
            ok: true,
            value: undefined
        };

    }

    if (
        !isValidMilestoneState(
            state
        )
    )
    {

        return buildLocalValidationError(
            `${fieldName} must be one of: ${VALID_MILESTONE_STATES.join(", ")}.`
        );

    }

    return {
        ok: true,
        value: state
    };

}

/**
 * @summary
 * Normalizes and validates milestone due_on.
 * @summary
 * Allows undefined when due_on is optional. Rejects non-string values and strings
 * that do not match GitHub's documented timestamp shape.
 * @summary
 * Internal helpers used:
 * - isValidMilestoneDueOn
 * - buildLocalValidationError
 *
 * @param {*} dueOn Milestone due date.
 * @param {string} [fieldName="due_on"] Field name for error messages.
 * 
 * @returns {Object} Object with ok/value or normalized validation error.
 */
export function normalizeMilestoneDueOn(
    dueOn,
    fieldName = "due_on"
)
{

    if (
        dueOn === undefined
    )
    {

        return {
            ok: true,
            value: undefined
        };

    }

    if (
        !isValidMilestoneDueOn(
            dueOn
        )
    )
    {

        return buildLocalValidationError(
            `${fieldName} must be an ISO 8601 UTC timestamp like YYYY-MM-DDTHH:MM:SSZ.`
        );

    }

    return {
        ok: true,
        value: dueOn
    };

}

/**
 * @summary
 * Normalizes and validates a create-milestone payload.
 * @summary
 * Requires title. Allows optional state, description, and due_on.
 * @summary
 * Internal helpers used:
 * - isPlainObject
 * - normalizeMilestoneState
 * - normalizeMilestoneDueOn
 * - buildLocalValidationError
 *
 * @param {Object} milestone Milestone creation payload.
 * @param {string} milestone.title Milestone title.
 * @param {string} [milestone.state] Milestone state, open or closed.
 * @param {string} [milestone.description] Milestone description.
 * @param {string} [milestone.due_on] Due date in YYYY-MM-DDTHH:MM:SSZ format.
 *
 * @returns {Object} Object with ok/value or normalized validation error.
 */
export function normalizeCreateMilestonePayload(
    milestone
)
{

    if (
        !isPlainObject(
            milestone
        )
    )
    {

        return buildLocalValidationError(
            "createMilestone requires a milestone payload object."
        );

    }

    if (
        typeof milestone.title !== "string" ||
        milestone.title.trim() === ""
    )
    {

        return buildLocalValidationError(
            "createMilestone requires milestone.title as a non-empty string."
        );

    }

    const normalizedState = normalizeMilestoneState(
        milestone.state,
        "milestone.state"
    );

    if (
        !normalizedState.ok
    )
    {

        return normalizedState;

    }

    const normalizedDueOn = normalizeMilestoneDueOn(
        milestone.due_on,
        "milestone.due_on"
    );

    if (
        !normalizedDueOn.ok
    )
    {

        return normalizedDueOn;

    }

    if (
        Object.prototype.hasOwnProperty.call(
            milestone,
            "description"
        ) &&
        milestone.description !== undefined &&
        typeof milestone.description !== "string"
    )
    {

        return buildLocalValidationError(
            "milestone.description must be a string when provided."
        );

    }

    const value = {
        ...milestone,
        title: milestone.title.trim()
    };

    if (
        normalizedState.value !== undefined
    )
    {

        value.state = normalizedState.value;

    }

    if (
        normalizedDueOn.value !== undefined
    )
    {

        value.due_on = normalizedDueOn.value;

    }

    return {
        ok: true,
        value
    };

}

/**
 * @summary
 * Normalizes and validates an update-milestone payload.
 * @summary
 * Requires at least one update field. Allows title, state, description, and due_on.
 * @summary
 * Internal helpers used:
 * - isPlainObject
 * - normalizeMilestoneState
 * - normalizeMilestoneDueOn
 * - buildLocalValidationError
 *
 * @param {Object} updates Milestone update payload.
 * @param {string} [updates.title] Updated milestone title.
 * @param {string} [updates.state] Updated milestone state, open or closed.
 * @param {string} [updates.description] Updated milestone description.
 * @param {string} [updates.due_on] Updated due date in YYYY-MM-DDTHH:MM:SSZ format.
 * 
 * @returns {Object} Object with ok/value or normalized validation error.
 */
export function normalizeUpdateMilestonePayload(
    updates
)
{

    if (
        !isPlainObject(
            updates
        )
    )
    {

        return buildLocalValidationError(
            "updateMilestone requires an updates payload object."
        );

    }

    if (
        Object.keys(
            updates
        ).length === 0
    )
    {

        return buildLocalValidationError(
            "updateMilestone requires at least one field to update."
        );

    }

    if (
        Object.prototype.hasOwnProperty.call(
            updates,
            "title"
        ) &&
        (
            typeof updates.title !== "string" ||
            updates.title.trim() === ""
        )
    )
    {

        return buildLocalValidationError(
            "updates.title must be a non-empty string when provided."
        );

    }

    const normalizedState = normalizeMilestoneState(
        updates.state,
        "updates.state"
    );

    if (
        !normalizedState.ok
    )
    {

        return normalizedState;

    }

    const normalizedDueOn = normalizeMilestoneDueOn(
        updates.due_on,
        "updates.due_on"
    );

    if (
        !normalizedDueOn.ok
    )
    {

        return normalizedDueOn;

    }

    if (
        Object.prototype.hasOwnProperty.call(
            updates,
            "description"
        ) &&
        updates.description !== undefined &&
        typeof updates.description !== "string"
    )
    {

        return buildLocalValidationError(
            "updates.description must be a string when provided."
        );

    }

    const value = {
        ...updates,
        title: typeof updates.title === "string" ? updates.title.trim() : updates.title
    };

    if (
        normalizedState.value !== undefined
    )
    {

        value.state = normalizedState.value;

    }

    if (
        normalizedDueOn.value !== undefined
    )
    {

        value.due_on = normalizedDueOn.value;

    }

    return {
        ok: true,
        value
    };

}
