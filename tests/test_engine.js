/**
 * ============================================================
 * EveryCourtAI
 * Test Engine
 * Version: 1.0
 * ============================================================
 *
 * 文件路径：
 * tests/test_engine.js
 *
 * 作用：
 * 1. 导入 EveryCourtAI 主引擎
 * 2. 读取测试案例
 * 3. 逐个执行测试
 * 4. 输出关键结果
 * 5. 显示 PASS / FAIL
 *
 * 注意：
 * - 本文件不参与推荐逻辑
 * - 本文件只用于测试 Engine 是否能完整跑通
 * ============================================================
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    runDeepAnalysis
} from "../engine/main_engine.js";


/**
 * ============================================================
 * 路径
 * ============================================================
 */

const CURRENT_FILE =
    fileURLToPath(
        import.meta.url
    );

const CURRENT_DIR =
    path.dirname(
        CURRENT_FILE
    );

const TEST_CASES_PATH =
    path.join(
        CURRENT_DIR,
        "test_cases.json"
    );

const OUTPUT_DIR =
    path.join(
        CURRENT_DIR,
        "output"
    );


/**
 * ============================================================
 * 通用工具
 * ============================================================
 */

function line() {
    console.log(
        "============================================================"
    );
}


function section(title) {
    console.log("");
    line();
    console.log(title);
    line();
}


function safeValue(
    value,
    fallback = "-"
) {
    return (
        value === null ||
        value === undefined ||
        value === ""
    )
        ? fallback
        : value;
}


/**
 * ============================================================
 * 读取测试案例
 * ============================================================
 */

async function loadTestCases() {
    const raw =
        await fs.readFile(
            TEST_CASES_PATH,
            "utf8"
        );

    const parsed =
        JSON.parse(
            raw
        );


    if (
        !Array.isArray(
            parsed
        )
    ) {
        throw new Error(
            "test_cases.json must contain an array."
        );
    }


    return parsed;
}


/**
 * ============================================================
 * 创建输出目录
 * ============================================================
 */

async function ensureOutputDirectory() {
    await fs.mkdir(
        OUTPUT_DIR,
        {
            recursive: true
        }
    );
}


/**
 * ============================================================
 * 保存完整结果
 * ============================================================
 */

async function saveResult(
    testCase,
    result,
    index
) {
    await ensureOutputDirectory();


    const timestamp =
        new Date()
            .toISOString()
            .replace(
                /[:.]/g,
                "-"
            );


    const safeName =
        String(
            testCase.name ??
            `test_${index + 1}`
        )
            .replace(
                /[^a-zA-Z0-9_-]/g,
                "_"
            );


    const fileName =
        `${timestamp}_${safeName}.json`;


    const filePath =
        path.join(
            OUTPUT_DIR,
            fileName
        );


    await fs.writeFile(
        filePath,
        JSON.stringify(
            result,
            null,
            2
        ),
        "utf8"
    );


    return filePath;
}


/**
 * ============================================================
 * 基础 PASS / FAIL
 * ============================================================
 */

function evaluateBasicPass(
    result
) {
    const checks = {
        engine_success:
            result?.success === true,

        recommendation_exists:
            Boolean(
                result
                    ?.recommendation
            ),

        confidence_exists:
            result
                ?.confidence
                ?.score !== null &&
            result
                ?.confidence
                ?.score !== undefined,

        explanation_exists:
            Boolean(
                result
                    ?.explanation
            ),

        pipeline_completed:
            Boolean(
                result
                    ?.pipeline
                    ?.explanation_engine
                    ?.status ===
                "completed"
            )
    };


    const passed =
        Object.values(
            checks
        )
            .every(Boolean);


    return {
        passed,
        checks
    };
}


/**
 * ============================================================
 * 输出推荐结果
 * ============================================================
 */

function printRecommendation(
    result
) {
    const recommendation =
        result?.recommendation;

    const racquet =
        recommendation
            ?.racquet_decision
            ?.recommended;

    const main =
        recommendation
            ?.string_setup
            ?.main;

    const cross =
        recommendation
            ?.string_setup
            ?.cross;

    const confidence =
        result
            ?.confidence;


    console.log("");
    console.log(
        "Best Racquet:"
    );

    console.log(
        `${safeValue(
            racquet?.brand
        )} ${safeValue(
            racquet?.model
        )}`
    );


    console.log("");
    console.log(
        "Best String:"
    );

    console.log(
        `${safeValue(
            main?.brand
        )} ${safeValue(
            main?.model
        )}`
    );


    console.log(
        "Gauge:",
        safeValue(
            main?.gauge_mm
        ),
        "mm"
    );


    console.log(
        "Main Tension:",
        safeValue(
            main?.tension_lbs
        ),
        "lbs"
    );


    if (
        cross
    ) {
        console.log("");
        console.log(
            "Cross String:"
        );

        console.log(
            `${safeValue(
                cross?.brand
            )} ${safeValue(
                cross?.model
            )}`
        );

        console.log(
            "Cross Gauge:",
            safeValue(
                cross?.gauge_mm
            ),
            "mm"
        );

        console.log(
            "Cross Tension:",
            safeValue(
                cross?.tension_lbs
            ),
            "lbs"
        );
    }


    console.log("");
    console.log(
        "Setup Type:",
        safeValue(
            recommendation
                ?.string_setup
                ?.type
        )
    );


    console.log(
        "Setup Score:",
        safeValue(
            recommendation
                ?.setup_score
        )
    );


    console.log("");
    console.log(
        "Confidence:",
        safeValue(
            confidence?.score
        ),
        "%"
    );


    console.log(
        "Confidence Level:",
        safeValue(
            confidence?.level
        )
    );
}


/**
 * ============================================================
 * 输出 Pipeline
 * ============================================================
 */

function printPipeline(
    result
) {
    console.log("");
    console.log(
        "Pipeline:"
    );


    const pipeline =
        result?.pipeline ?? {};


    for (
        const [
            engine,
            data
        ]
        of Object.entries(
            pipeline
        )
    ) {
        console.log(
            `- ${engine}: ${
                data?.status ??
                "unknown"
            }`
        );
    }
}


/**
 * ============================================================
 * 单个测试
 * ============================================================
 */

async function runSingleTest(
    testCase,
    index
) {
    section(
        `TEST ${index + 1}: ${
            testCase.name ??
            "Unnamed Test"
        }`
    );


    console.log(
        "Running EveryCourtAI..."
    );


    const result =
        await runDeepAnalysis(
            testCase.player ??
            {}
        );


    const evaluation =
        evaluateBasicPass(
            result
        );


    printRecommendation(
        result
    );


    printPipeline(
        result
    );


    console.log("");
    console.log(
        "Checks:"
    );


    for (
        const [
            check,
            passed
        ]
        of Object.entries(
            evaluation.checks
        )
    ) {
        console.log(
            `${
                passed
                    ? "✅"
                    : "❌"
            } ${check}`
        );
    }


    console.log("");
    console.log(
        evaluation.passed
            ? "✅ PASS"
            : "❌ FAIL"
    );


    const outputPath =
        await saveResult(
            testCase,
            {
                test_case:
                    testCase,

                evaluation,

                result
            },
            index
        );


    console.log("");
    console.log(
        "Full result saved:"
    );

    console.log(
        outputPath
    );


    return {
        name:
            testCase.name,

        passed:
            evaluation.passed,

        output_path:
            outputPath
    };
}


/**
 * ============================================================
 * 主测试程序
 * ============================================================
 */

async function main() {
    section(
        "EveryCourtAI Engine Test"
    );


    console.log(
        "Loading test cases..."
    );


    const testCases =
        await loadTestCases();


    console.log(
        `Found ${testCases.length} test case(s).`
    );


    const results = [];


    for (
        let index = 0;
        index < testCases.length;
        index += 1
    ) {
        try {

            const result =
                await runSingleTest(
                    testCases[index],
                    index
                );


            results.push(
                result
            );

        } catch (error) {

            console.error("");
            console.error(
                "❌ TEST ERROR"
            );

            console.error(
                error
            );


            results.push({
                name:
                    testCases[index]
                        ?.name ??
                    `Test ${index + 1}`,

                passed:
                    false,

                error:
                    error instanceof Error
                        ? error.message
                        : String(error)
            });
        }
    }


    /**
     * ========================================================
     * Final Summary
     * ========================================================
     */

    section(
        "TEST SUMMARY"
    );


    const passed =
        results.filter(
            item =>
                item.passed
        )
            .length;


    const failed =
        results.length -
        passed;


    console.log(
        "Total:",
        results.length
    );

    console.log(
        "Passed:",
        passed
    );

    console.log(
        "Failed:",
        failed
    );


    console.log("");


    for (
        const result
        of results
    ) {
        console.log(
            `${
                result.passed
                    ? "✅"
                    : "❌"
            } ${
                result.name
            }`
        );
    }


    line();


    /**
     * Node exit code
     */

    if (
        failed > 0
    ) {
        process.exitCode = 1;
    }
}


/**
 * ============================================================
 * Start
 * ============================================================
 */

main()
    .catch(
        error => {

            console.error(
                "EveryCourtAI Test Engine Fatal Error:"
            );

            console.error(
                error
            );

            process.exitCode = 1;
        }
    );
