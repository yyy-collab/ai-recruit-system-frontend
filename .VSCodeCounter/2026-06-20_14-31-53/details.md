# Details

Date : 2026-06-20 14:31:53

Directory e:\\ai-recruit-system\\frontend\\ai-recruit-system-frontend

Total : 50 files,  8398 codes, 78 comments, 852 blanks, all 9328 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [README.md](/README.md) | Markdown | 84 | 0 | 12 | 96 |
| [index.html](/index.html) | HTML | 12 | 0 | 0 | 12 |
| [package-lock.json](/package-lock.json) | JSON | 1,408 | 0 | 1 | 1,409 |
| [package.json](/package.json) | JSON | 25 | 0 | 0 | 25 |
| [public/favicon.svg](/public/favicon.svg) | XML | 1 | 0 | 0 | 1 |
| [public/icons.svg](/public/icons.svg) | XML | 24 | 0 | 1 | 25 |
| [src/App.vue](/src/App.vue) | vue | 13 | 0 | 3 | 16 |
| [src/api/index.js](/src/api/index.js) | JavaScript | 8 | 1 | 0 | 9 |
| [src/api/modules/ai.js](/src/api/modules/ai.js) | JavaScript | 5 | 4 | 1 | 10 |
| [src/api/modules/common.js](/src/api/modules/common.js) | JavaScript | 18 | 6 | 5 | 29 |
| [src/api/modules/delivery.js](/src/api/modules/delivery.js) | JavaScript | 7 | 1 | 3 | 11 |
| [src/api/modules/hr.js](/src/api/modules/hr.js) | JavaScript | 9 | 0 | 1 | 10 |
| [src/api/modules/interview.js](/src/api/modules/interview.js) | JavaScript | 7 | 6 | 2 | 15 |
| [src/api/modules/job.js](/src/api/modules/job.js) | JavaScript | 8 | 7 | 2 | 17 |
| [src/api/modules/resume.js](/src/api/modules/resume.js) | JavaScript | 11 | 0 | 3 | 14 |
| [src/api/modules/seeker.js](/src/api/modules/seeker.js) | JavaScript | 9 | 0 | 1 | 10 |
| [src/api/request.js](/src/api/request.js) | JavaScript | 133 | 10 | 20 | 163 |
| [src/assets/vite.svg](/src/assets/vite.svg) | XML | 1 | 0 | 1 | 2 |
| [src/assets/vue.svg](/src/assets/vue.svg) | XML | 1 | 0 | 0 | 1 |
| [src/components/Layout.vue](/src/components/Layout.vue) | vue | 313 | 0 | 40 | 353 |
| [src/components/SendInterviewDialog.vue](/src/components/SendInterviewDialog.vue) | vue | 425 | 0 | 54 | 479 |
| [src/composables/useRequest.js](/src/composables/useRequest.js) | JavaScript | 35 | 0 | 3 | 38 |
| [src/composables/useRole.js](/src/composables/useRole.js) | JavaScript | 9 | 1 | 1 | 11 |
| [src/main.js](/src/main.js) | JavaScript | 16 | 1 | 4 | 21 |
| [src/router/index.js](/src/router/index.js) | JavaScript | 41 | 2 | 9 | 52 |
| [src/router/routes.js](/src/router/routes.js) | JavaScript | 41 | 0 | 4 | 45 |
| [src/stores/user.js](/src/stores/user.js) | JavaScript | 71 | 1 | 2 | 74 |
| [src/utils/auth.js](/src/utils/auth.js) | JavaScript | 58 | 10 | 8 | 76 |
| [src/utils/errorCodes.js](/src/utils/errorCodes.js) | JavaScript | 31 | 1 | 2 | 34 |
| [src/utils/format.js](/src/utils/format.js) | JavaScript | 23 | 6 | 5 | 34 |
| [src/utils/upload.js](/src/utils/upload.js) | JavaScript | 23 | 3 | 4 | 30 |
| [src/utils/validator.js](/src/utils/validator.js) | JavaScript | 10 | 6 | 1 | 17 |
| [src/utils/view.js](/src/utils/view.js) | JavaScript | 86 | 0 | 11 | 97 |
| [src/views/common/Login.vue](/src/views/common/Login.vue) | vue | 100 | 0 | 5 | 105 |
| [src/views/common/PlaceHolder.vue](/src/views/common/PlaceHolder.vue) | vue | 14 | 0 | 2 | 16 |
| [src/views/common/Register.vue](/src/views/common/Register.vue) | vue | 58 | 0 | 3 | 61 |
| [src/views/common/ResetPwd.vue](/src/views/common/ResetPwd.vue) | vue | 177 | 0 | 11 | 188 |
| [src/views/common/RoleSelect.vue](/src/views/common/RoleSelect.vue) | vue | 257 | 1 | 6 | 264 |
| [src/views/hr/HRMessageList.vue](/src/views/hr/HRMessageList.vue) | vue | 356 | 4 | 42 | 402 |
| [src/views/hr/Jobs.vue](/src/views/hr/Jobs.vue) | vue | 550 | 0 | 77 | 627 |
| [src/views/hr/Settings.vue](/src/views/hr/Settings.vue) | vue | 329 | 3 | 22 | 354 |
| [src/views/hr/SmartPool.vue](/src/views/hr/SmartPool.vue) | vue | 953 | 0 | 150 | 1,103 |
| [src/views/hr/components/MessageDetailDialog.vue](/src/views/hr/components/MessageDetailDialog.vue) | vue | 105 | 0 | 16 | 121 |
| [src/views/hr/jobs/CreateJob.vue](/src/views/hr/jobs/CreateJob.vue) | vue | 203 | 0 | 19 | 222 |
| [src/views/seeker/Jobs.vue](/src/views/seeker/Jobs.vue) | vue | 592 | 0 | 91 | 683 |
| [src/views/seeker/ResumeCenter.vue](/src/views/seeker/ResumeCenter.vue) | vue | 697 | 0 | 89 | 786 |
| [src/views/seeker/SeekerMessageList.vue](/src/views/seeker/SeekerMessageList.vue) | vue | 390 | 0 | 63 | 453 |
| [src/views/seeker/Settings.vue](/src/views/seeker/Settings.vue) | vue | 486 | 4 | 31 | 521 |
| [src/views/seeker/components/MessageDetailDialog.vue](/src/views/seeker/components/MessageDetailDialog.vue) | vue | 140 | 0 | 20 | 160 |
| [vite.config.js](/vite.config.js) | JavaScript | 25 | 0 | 1 | 26 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)