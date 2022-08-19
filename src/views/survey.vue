<template>
    <q-page-container>
        <q-page>
            <iframe class="fit fixed"
                src="https://forms.office.com/Pages/ResponsePage.aspx?id=KVxybjp2UE-B8i4lTwEzyI6HSAJt199As0KTnNPeoqFUQjVMWEVOWlMwVFVCTlNJQjdKS0VQTDJVTy4u&embed=true"
                frameborder="0" marginwidth="0" marginheight="0" style="border: none; max-width:100%; max-height:100vh;"
                allowfullscreen webkitallowfullscreen mozallowfullscreen msallowfullscreen />
            <q-card class="absolute-bottom-right q-ma-lg">
                <q-card-section class="text-h6 text-weight-bold text-white profile">
                    <div>Infomation About this project</div>
                </q-card-section>
                <q-card-section>
                    <div>Multi views implementation of COVID-19 visualization</div>
                    <q-separator spaced />
                    <div v-for="record in info" :key="record">
                        <span>{{ record.key }}</span>
                        <span v-if="record.key.length" class="q-mx-sm" />
                        <span>{{ record.value }}</span>
                    </div>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat class="text-blue" label="Give a feedback" no-caps
                        href="mailto:2551327Y@student.gla.ac.uk" />
                </q-card-actions>
            </q-card>
        </q-page>
    </q-page-container>
</template>

<script lang="js">
export default {
    data() {
        return {
            info: {
                name: {
                    key: 'MSc Student',
                    value: 'Yifan Y',
                },
                id: {
                    key: 'GUID',
                    value: '2551327y',
                },
                mail: {
                    key: 'Mail',
                    value: '2551327y@student.gla.ac.uk',
                },
                school: {
                    key: '',
                    value: 'School of Computing Science',
                },
                university: {
                    key: '',
                    value: 'University of Glasgow',
                }
            }
        }
    },
}
</script>

<style scoped>
.profile {
    background-color: #003865;
    font-family: 'Times New Roman', Times, serif;
}
</style>