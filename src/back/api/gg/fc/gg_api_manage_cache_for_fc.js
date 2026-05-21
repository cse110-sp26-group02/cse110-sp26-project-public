import {
    buildGeminiLocalValidationError,
    createGeminiRequestConfig,
    geminiRequest,
    isPlainObject,
    normalizeGeminiModelName
} from "./gem_api_help.js";

/**
 * Builds a cachedContent creation payload for reusable function-selection context.
 *
 * Internal helpers used:
 * - normalizeGeminiModelName
 * - buildGeminiLocalValidationError
 *
 * @param {string} model Gemini model name.
 * @param {string} reusableContext Large repeated context.
 * @param {Object} [options={}] Cache options.
 * @param {string} [options.displayName] Cache display name.
 * @param {string} [options.ttl="3600s"] Cache TTL.
 * @returns {Object} Object with ok/value or normalized validation error.
 */
export function buildFunctionSelectionCachePayload(
    model,
    reusableContext,
    options = {}
)
{

    const normalizedModel = normalizeGeminiModelName(
        model
    );

    if (
        !normalizedModel.ok
    )
    {

        return normalizedModel;

    }

    if (
        typeof reusableContext !== "string" ||
        reusableContext.trim() === ""
    )
    {

        return buildGeminiLocalValidationError(
            "Reusable context must be a non-empty string."
        );

    }

    return {
        ok: true,
        value: {
            model: normalizedModel.value,
            displayName: options.displayName || "local-function-selection-cache",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: reusableContext
                        }
                    ]
                }
            ],
            ttl: options.ttl || "3600s"
        }
    };

}

/**
 * Creates a Gemini cachedContent object.
 *
 * Internal helpers used:
 * - createGeminiRequestConfig
 * - buildFunctionSelectionCachePayload
 * - geminiRequest
 *
 * @param {string} model Gemini model name.
 * @param {string} reusableContext Large repeated context.
 * @param {Object} [options={}] Cache options.
 * @param {Object} [requestOptions={}] Request options with apiKey.
 * @returns {Promise<Object>} Normalized API response.
 */
export async function createFunctionSelectionCache(
    model,
    reusableContext,
    options = {},
    requestOptions = {}
)
{

    const config = createGeminiRequestConfig(
        requestOptions.config || {}
    );

    const payload = buildFunctionSelectionCachePayload(
        model,
        reusableContext,
        options
    );

    if (
        !payload.ok
    )
    {

        return payload;

    }

    return geminiRequest(
        "POST",
        `/${config.apiVersion}/cachedContents`,
        {
            ...requestOptions,
            body: payload.value
        }
    );

}

/**
 * Updates a cachedContent TTL or expire_time.
 *
 * Internal helpers used:
 * - buildGeminiLocalValidationError
 * - geminiRequest
 *
 * @param {string} cacheName Cached content resource name.
 * @param {Object} update Cache update.
 * @param {string} [update.ttl] New TTL.
 * @param {string} [update.expire_time] New expiration time.
 * @param {Object} [requestOptions={}] Request options with apiKey.
 * @returns {Promise<Object>} Normalized API response.
 */
export async function updateFunctionSelectionCache(
    cacheName,
    update,
    requestOptions = {}
)
{

    if (
        typeof cacheName !== "string" ||
        cacheName.trim() === ""
    )
    {

        return buildGeminiLocalValidationError(
            "cacheName must be a non-empty string."
        );

    }

    if (
        !isPlainObject(
            update
        ) ||
        (
            !update.ttl &&
            !update.expire_time
        )
    )
    {

        return buildGeminiLocalValidationError(
            "Cache update must include ttl or expire_time."
        );

    }

    return geminiRequest(
        "PATCH",
        `/${cacheName.replace(/^\/+/, "")}`,
        {
            ...requestOptions,
            body: update
        }
    );

}

/**
 * Deletes a cachedContent object.
 *
 * Internal helpers used:
 * - buildGeminiLocalValidationError
 * - geminiRequest
 *
 * @param {string} cacheName Cached content resource name.
 * @param {Object} [requestOptions={}] Request options with apiKey.
 * @returns {Promise<Object>} Normalized API response.
 */
export async function deleteFunctionSelectionCache(
    cacheName,
    requestOptions = {}
)
{

    if (
        typeof cacheName !== "string" ||
        cacheName.trim() === ""
    )
    {

        return buildGeminiLocalValidationError(
            "cacheName must be a non-empty string."
        );

    }

    return geminiRequest(
        "DELETE",
        `/${cacheName.replace(/^\/+/, "")}`,
        requestOptions
    );

}
