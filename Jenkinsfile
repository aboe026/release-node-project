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
    def containerRootPath = '/var/jenkins_home'
    def exceptionThrown = false
    def packageJson
    def groovyLintCommand
    def workDirHostPath

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
                        currentBuild.displayName = packageJson.version

                        groovyLintImage += ":${packageJson.devDependencies['npm-groovy-lint']}"
                        groovyLintCommand = packageJson.scripts['lint-groovy']

                        def containerInfo = sh(
                            script: 'docker inspect cicd-jenkins-1',
                            returnStdout: true
                        )
                        def containerJson = readJSON text: containerInfo
                        def hostMountPath
                        containerJson[0].Mounts.each { mount ->
                            if (mount.Destination == containerRootPath) {
                                hostMountPath = mount.Source
                            }
                        }
                        workDirHostPath = "${workDir.replace(containerRootPath, hostMountPath)}"
                    }
                    stage('Pull Images') {
                        sh "docker pull ${nodeImage}"
                        sh "docker pull ${groovyLintImage}"
                    }

                    parallel(
                        'groovy': {
                            stage('Lint Groovy') {
                                docker.image(groovyLintImage).inside('--entrypoint=""') {
                                    sh "${groovyLintCommand}"
                                }
                            }
                        },
                        'node': {
                            docker.image(nodeImage).inside {
                                stage('Install') {
                                    sh 'node --version'
                                    sh 'yarn --version'
                                    sh 'yarn install --immutable'
                                }

                                stage('Lint Node') {
                                    sh 'yarn lint-node'
                                    sh 'yarn lint-release-notes'
                                }

                                stage('Build') {
                                    sh 'yarn build'
                                }
                            }
                        }
                    )

                    docker.image(nodeImage).inside('-v /var/run/docker.sock:/var/run/docker.sock') {
                        parallel(
                            'unit-tests': {
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
                            },
                            'docker-cli': {
                                stage('Docker CLI') {
                                    sh 'apt-get update'
                                    sh 'apt-get install -y docker.io'
                                }
                            }
                        )

                        stage('E2E Test') {
                            try {
                                withEnv([
                                    'E2E_GITHUB_ORG=aboe026',
                                    'E2E_GITHUB_PAT=dummy', // this is not actually used because running through WireMock
                                    "E2E_MOUNT_DIR=${workDirHostPath}",
                                    'E2E_WIREMOCK_HOST=host.docker.internal'
                                ]) {
                                    sh 'yarn test-e2e-ci'
                                }
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
