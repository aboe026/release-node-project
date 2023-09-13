@Library('aboe026') _ // groovylint-disable-line VariableName, UnusedVariable

import org.aboe026.ShieldsIoBadges

node {
    def repoName = 'release-node-project'
    def workDir = "${WORKSPACE}/${env.BRANCH_NAME}-${env.BUILD_ID}"
    def nodeImage = 'node:18'
    def groovyLintImage = 'nvuillam/npm-groovy-lint'
    def badges = new ShieldsIoBadges(this, repoName)
    def releaseBranchRegex = /^\d+\.\d+$/
    def isLatest = env.BRANCH_NAME == 'main'
    def upload = isLatest || env.BRANCH_NAME ==~ releaseBranchRegex
    def packageJsonFile = 'package.json'
    def exceptionThrown = false
    def packageJson

    try {
        timeout(time: 20, unit: 'MINUTES') {
            ansiColor('xterm') {
                dir(workDir) {
                    stage('Prep') {
                        checkout scm

                        packageJson = readJSON file: packageJsonFile
                        projectName = packageJson.name.split('/')[0].replace('@', '')
                        // need ".toString()" below otherwise it gets interpreted as org.codehaus.groovy.runtime.GStringImpl object
                        packageJson.version = "${packageJson.version}-${env.BRANCH_NAME}-${env.BUILD_ID}".toString()
                        writeJSON(
                            file: packageJsonFile,
                            json: packageJson,
                            pretty: 2
                        )
                        groovyLintImage += ":${packageJson.devDependencies.npm-groovy-lint}"
                        currentBuild.displayName = packageJson.version
                    }
                    stage('Pull Images') {
                        sh "docker pull ${nodeImage}"
                        sh "docker pull ${groovyLintImage}"
                    }

                    docker.image(nodeImage).inside {
                        stage('Install') {
                            sh 'node --version'
                            sh 'yarn --version'
                            sh 'yarn install --immutable'
                        }

                        stage('Lint') {
                            parallel(
                                'node': {
                                    sh 'yarn lint-node'
                                    sh 'yarn lint-release-notes'
                                },
                                'groovy': {
                                    docker.image(groovyLintImage).inside {
                                        sh 'npm-groovy-lint --ignorepattern "**/node_modules/**" --failon info'
                                    }
                                }
                            )
                        }

                        stage('Build') {
                            sh 'yarn build'
                        }

                        stage('Unit Test') {
                            try {
                                sh 'yarn test-unit-ci'
                            } catch (err) {
                                exceptionThrown = true
                                println 'Exception was caught in try block of "Unit Test" stage:'
                                println err
                            } finally {
                                junit testResults: 'test-results/unit.xml', allowEmptyResults: true
                                recordCoverage(
                                    skipPublishingChecks: true,
                                    sourceCodeRetention: 'EVERY_BUILD',
                                    tools: [
                                        [
                                            parser: 'COBERTURA',
                                            pattern: 'coverage/cobertura-coverage.xml'
                                        ]
                                    ]
                                )
                                if (upload) {
                                    badges.uploadCoverageResult(
                                        branch: env.BRANCH_NAME
                                    )
                                }
                            }
                        }

                        stage('E2E Test') {
                            try {
                                sh 'yarn test-e2e-ci'
                            } catch (err) {
                                exceptionThrown = true
                                println 'Exception was caught in try block of "E2E Test" stage:'
                                println err
                            } finally {
                                junit testResults: 'test-results/e2e.xml', allowEmptyResults: true
                            }
                        }

                        if (upload) {
                            stage('Nexus Upload') {
                                withCredentials([
                                    usernamePassword(credentialsId: 'NEXUS_CREDENTIALS', usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD'),
                                    string(credentialsId: 'NEXUS_URL', variable: 'nexusUrl')
                                ]) {
                                    withEnv([
                                        "YARN_NPM_AUTH_IDENT=${NEXUS_USERNAME}:${NEXUS_PASSWORD}",
                                        "YARN_NPM_PUBLISH_REGISTRY=${nexusUrl}/repository/${repoName}/",
                                        "YARN_UNSAFE_HTTP_WHITELIST=${new URI(nexusUrl).getHost()}"
                                    ]) {
                                        sh 'yarn npm login --publish'
                                        sh "yarn npm publish --tag=${packageJson.version} ${isLatest ? '--tag=latest' : ''}"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        exceptionThrown = true
        println 'Exception was caught in try block of jenkins job.'
        println err
    }  finally {
        if (upload) {
            badges.uploadBuildResult(
                branch: env.BRANCH_NAME
            )
        }
        stage('Cleanup') {
            try {
                sh "rm -rf ${workDir}"
            } catch (err) {
                println 'Exception deleting working directory'
                println err
            }
            try {
                sh "rm -rf ${workDir}@tmp"
            } catch (err) {
                println 'Exception deleting temporary working directory'
                println err
            }
            if (exceptionThrown) {
                error('Exception was thrown earlier')
            }
        }
    }
}
