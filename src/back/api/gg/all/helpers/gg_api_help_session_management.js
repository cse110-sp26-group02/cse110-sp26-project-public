import {
    buildGeminiLocalValidationError,
    buildGeminiModelActionPath,
    createGeminiRequestConfig
} from "./gem_api_help.js";

import {
    attachFunctionCallingParsedFields,
    buildFunctionResponseContentFromCall,
    geminiFunctionCallingRequest
} from "./gemini_fc_help.js";

import {
    buildFunctionSelectionPayload
} from "./gemini_fc_tools_core.js";

/**
 * Creates a local function-calling session state object.
 *
 * Internal helpers used:
 * - none
 *
 * @param {Object} options Session options.
 * @param {string} options.model Gemini model name.
 * @param {Object[]} options.functions Local function descriptors.
 * @param {string} [options.sessionMode] Session mode.
 * @returns {Object} Session state.
 */
export function createFunctionCallingSession(
    options
)
{

    return {
        id: options.id || crypto.randomUUID(),
        model: options.model,
        functions: options.functions || [],
        sessionMode: options.sessionMode || "repeated-use",
        contents: [],
        thoughtSignatures: [],
        usageMetadataLog: [],
        functionCallLog: [],
        resultLog: [],
        isCancelled: false
    };

}

/**
 * Sends one function-selection turn to Gemini.
 *
 * Internal helpers used:
 * - createGeminiRequestConfig
 * - buildGeminiModelActionPath
 * - buildFunctionSelectionPayload
 * - geminiFunctionCallingRequest
 *
 * @param {Object} session Function-calling session state.
 * @param {Object} turn Turn options.
 * @param {Object} requestOptions Request options with apiKey.
 * @returns {Promise<Object>} Normalized Gemini result.
 */
export async function sendFunctionSelectionTurn(
    session,
    turn,
    requestOptions = {}
)
{

    const config = createGeminiRequestConfig(
        requestOptions.config || {}
    );

    const path = buildGeminiModelActionPath(
        session.model,
        config.apiVersion,
        "generateContent"
    );

    if (
        !path.ok
    )
    {

        return path;

    }

    const payload = buildFunctionSelectionPayload(
        {
            functions: session.functions,
            userRequest: turn.userRequest,
            additionalContext: turn.additionalContext,
            selectionGuidance: turn.selectionGuidance,
            thinkingDirection: turn.thinkingDirection,
            thinkingStrength: turn.thinkingStrength,
            thinking: turn.thinking,
            mode: turn.mode,
            allowedFunctionNames: turn.allowedFunctionNames,
            cachedContent: turn.cachedContent
        }
    );

    if (
        !payload.ok
    )
    {

        return payload;

    }

    if (
        session.contents.length > 0
    )
    {

        payload.value.contents = [
            ...session.contents,
            ...payload.value.contents
        ];

    }

    const result = await geminiFunctionCallingRequest(
        path.value,
        payload.value,
        requestOptions,
        turn.retry || {}
    );

    recordFunctionCallingResultInSession(
        session,
        result
    );

    return result;

}

/**
 * Records parsed Gemini result fields in session state.
 *
 * Internal helpers used:
 * - none
 *
 * @param {Object} session Function-calling session state.
 * @param {Object} result Gemini result.
 * @returns {Object} Updated session.
 */
export function recordFunctionCallingResultInSession(
    session,
    result
)
{

    if (
        !result.ok
    )
    {

        session.resultLog.push(
            result
        );

        return session;

    }

    if (
        result.modelContentTurn
    )
    {

        session.contents.push(
            result.modelContentTurn
        );

    }

    if (
        Array.isArray(
            result.thoughtSignatures
        )
    )
    {

        session.thoughtSignatures.push(
            ...result.thoughtSignatures
        );

    }

    if (
        result.usageMetadata
    )
    {

        session.usageMetadataLog.push(
            result.usageMetadata
        );

    }

    if (
        Array.isArray(
            result.functionCalls
        )
    )
    {

        session.functionCallLog.push(
            ...result.functionCalls
        );

    }

    session.resultLog.push(
        result
    );

    return session;

}

/**
 * Executes function calls using a provided executor map.
 *
 * Internal helpers used:
 * - buildFunctionResponseContentFromCall
 *
 * @param {Object[]} functionCalls Gemini function calls.
 * @param {Object} executors Map of function name to callable.
 * @param {Object} [options={}] Execution options.
 * @param {boolean} [options.parallel=false] Whether to execute in parallel.
 * @returns {Promise<Object>} Object with ok/value or normalized validation error.
 */
export async function executeFunctionCalls(
    functionCalls,
    executors,
    options = {}
)
{

    if (
        !Array.isArray(
            functionCalls
        )
    )
    {

        return buildGeminiLocalValidationError(
            "functionCalls must be an array."
        );

    }

    const runOne = async function(
        functionCall
    )
    {

        const executor = executors[functionCall.name];

        if (
            typeof executor !== "function"
        )
        {

            return buildFunctionResponseContentFromCall(
                functionCall,
                {
                    ok: false,
                    error: `No local executor registered for ${functionCall.name}.`
                }
            );

        }

        try
        {

            const response = await executor(
                functionCall.args || {}
            );

            return buildFunctionResponseContentFromCall(
                functionCall,
                {
                    ok: true,
                    data: response
                }
            );

        }
        catch (
            error
        )
        {

            return buildFunctionResponseContentFromCall(
                functionCall,
                {
                    ok: false,
                    error: error.message || String(
                        error
                    )
                }
            );

        }

    };

    const results = options.parallel ? await Promise.all(
        functionCalls.map(
            runOne
        )
    ) : [];

    if (
        !options.parallel
    )
    {

        for (
            const functionCall of functionCalls
        )
        {

            results.push(
                await runOne(
                    functionCall
                )
            );

        }

    }

    for (
        const result of results
    )
    {

        if (
            !result.ok
        )
        {

            return result;

        }

    }

    return {
        ok: true,
        value: results.map(
            function(
                result
            )
            {

                return result.value;

            }
        )
    };

}

/**
 * Appends function response contents to session history.
 *
 * Internal helpers used:
 * - none
 *
 * @param {Object} session Function-calling session state.
 * @param {Object[]} responseContents Function response content turns.
 * @returns {Object} Updated session.
 */
export function appendFunctionResponsesToSession(
    session,
    responseContents
)
{

    session.contents.push(
        ...responseContents
    );

    return session;

}

/**
 * Runs a single-use function selection without executing tools.
 *
 * Internal helpers used:
 * - createFunctionCallingSession
 * - sendFunctionSelectionTurn
 *
 * @param {Object} options Run options.
 * @param {Object} requestOptions Request options with apiKey.
 * @returns {Promise<Object>} Normalized Gemini result.
 */
export async function runSingleUseFunctionSelection(
    options,
    requestOptions = {}
)
{

    const session = createFunctionCallingSession(
        {
            model: options.model,
            functions: options.functions,
            sessionMode: "single-use"
        }
    );

    return sendFunctionSelectionTurn(
        session,
        options,
        requestOptions
    );

}

/**
 * Runs a non-parallel agent loop.
 *
 * Executes function calls one at a time, appends function responses, and repeats
 * until the model returns text or maxSteps is reached.
 *
 * Internal helpers used:
 * - createFunctionCallingSession
 * - sendFunctionSelectionTurn
 * - executeFunctionCalls
 * - appendFunctionResponsesToSession
 *
 * @param {Object} options Run options.
 * @param {Object} executors Function executor map.
 * @param {Object} requestOptions Request options with apiKey.
 * @returns {Promise<Object>} Session summary.
 */
export async function runNonParallelAgentSession(
    options,
    executors,
    requestOptions = {}
)
{

    return runRepeatedUseAgentSession(
        {
            ...options,
            sessionMode: "non-parallel",
            parallel: false
        },
        executors,
        requestOptions
    );

}

/**
 * Runs a parallel agent loop.
 *
 * Executes function calls from a model turn together, appends function responses,
 * and repeats until the model returns text or maxSteps is reached.
 *
 * Internal helpers used:
 * - createFunctionCallingSession
 * - sendFunctionSelectionTurn
 * - executeFunctionCalls
 * - appendFunctionResponsesToSession
 *
 * @param {Object} options Run options.
 * @param {Object} executors Function executor map.
 * @param {Object} requestOptions Request options with apiKey.
 * @returns {Promise<Object>} Session summary.
 */
export async function runParallelAgentSession(
    options,
    executors,
    requestOptions = {}
)
{

    return runRepeatedUseAgentSession(
        {
            ...options,
            sessionMode: "parallel",
            parallel: true
        },
        executors,
        requestOptions
    );

}

/**
 * Runs a repeated-use agent session.
 *
 * Internal helpers used:
 * - createFunctionCallingSession
 * - sendFunctionSelectionTurn
 * - executeFunctionCalls
 * - appendFunctionResponsesToSession
 * - attachFunctionCallingParsedFields
 *
 * @param {Object} options Run options.
 * @param {Object} executors Function executor map.
 * @param {Object} requestOptions Request options with apiKey.
 * @returns {Promise<Object>} Session summary.
 */
export async function runRepeatedUseAgentSession(
    options,
    executors,
    requestOptions = {}
)
{

    const session = createFunctionCallingSession(
        {
            model: options.model,
            functions: options.functions,
            sessionMode: options.sessionMode || "repeated-use"
        }
    );

    const maxSteps = Number.isInteger(
        options.maxSteps
    ) ? options.maxSteps : 5;

    let latestResult = null;

    for (
        let step = 0;
        step < maxSteps;
        step += 1
    )
    {

        if (
            session.isCancelled
        )
        {

            break;

        }

        latestResult = await sendFunctionSelectionTurn(
            session,
            options,
            requestOptions
        );

        if (
            !latestResult.ok
        )
        {

            break;

        }

        if (
            !latestResult.functionCalls ||
            latestResult.functionCalls.length === 0
        )
        {

            break;

        }

        const functionResponses = await executeFunctionCalls(
            latestResult.functionCalls,
            executors,
            {
                parallel: options.parallel === true
            }
        );

        if (
            !functionResponses.ok
        )
        {

            latestResult = functionResponses;
            break;

        }

        appendFunctionResponsesToSession(
            session,
            functionResponses.value
        );

    }

    return {
        ok: latestResult ? latestResult.ok : false,
        session,
        latestResult,
        text: latestResult && latestResult.text ? latestResult.text : "",
        usageMetadataLog: session.usageMetadataLog,
        thoughtSignatures: session.thoughtSignatures
    };

}

/**
 * Starts an async-style agent session controller.
 *
 * This does not hide background work inside the wrapper. It returns a promise
 * and a cancel method so the caller manages the lifecycle.
 *
 * Internal helpers used:
 * - runRepeatedUseAgentSession
 *
 * @param {Object} options Run options.
 * @param {Object} executors Function executor map.
 * @param {Object} requestOptions Request options with apiKey.
 * @returns {Object} Async controller.
 */
export function startAsyncAgentSession(
    options,
    executors,
    requestOptions = {}
)
{

    const controller = {
        cancelled: false,
        cancel: function()
        {

            controller.cancelled = true;

        },
        promise: null
    };

    controller.promise = runRepeatedUseAgentSession(
        {
            ...options,
            shouldCancel: function()
            {

                return controller.cancelled;

            }
        },
        executors,
        requestOptions
    );

    return controller;

}
