<template>
    <v-container>
        <v-row align="center">
            <v-text-field label="Stream Id" v-model="streamId" />
            <v-text-field label="Token" v-model="token" />
            <v-btn rounded color="brown" @click="reload">
                Reload
            </v-btn>
        </v-row>
        <v-row align="center">
            <div id="renderer" ref="renderer" class=""></div>
        </v-row>
        
        <v-row class="mt-12">
            <input @change="handleImage" class="custom-input" type="file" accept="image/*" id="defectimg" name="defectimg">

        </v-row>
        <v-row>
            <v-text-field label="Defect Type" v-model="defectType" />
            <v-text-field label="Comments" v-model="defectComments" />
            <v-btn rounded color="info" @click="addDefect">
                Add Defect
            </v-btn>
        </v-row>
        <v-row>
            <v-img :src="defectImage"></v-img>
        </v-row>
        <v-row>
            <v-col>
                <v-progress-linear
                    v-if="progressLoading"
                    indeterminate
                ></v-progress-linear>
            </v-col>
        </v-row>
        <v-row>
            <v-alert v-if="finishedLoading" text color="light-blue">
                <h3 class="text-h5">
                    Generated Stream
                </h3>
                <div>
                    Your point cloud has been generated from your images. View
                    your results here!
                </div>

                <v-divider class="my-4 info" style="opacity: 0.22"></v-divider>

                <v-row align="center" no-gutters>
                    <v-col class="grow">
                        <v-text-field
                            v-model="streamUrl"
                            dense
                            filled
                            rounded
                            readonly
                        ></v-text-field>
                        <div></div>
                    </v-col>
                    <v-spacer></v-spacer>
                    <v-col class="shrink">
                        <v-btn
                            color="info"
                            :href="streamUrl"
                            target="_blank"
                            rounded
                        >
                            Open
                        </v-btn>
                    </v-col>
                </v-row>
            </v-alert>
            <v-alert
                v-if="alert"
                outlined
                color="warning"
                prominent
                dismissible
            >
                Could not generate point cloud :(
            </v-alert>
        </v-row>

    </v-container>
</template>

<style scoped>

#renderer {
  width: 100vw;
  height: 50vh;
  padding-top: 10px;
  border-style: dotted;
}

</style>

<script>
import axios from 'axios';
import { Viewer } from '@speckle/viewer';
import { getStreamCommits } from "../viewer/speckleUtils.js";

export default {
    name: "Home",
    data: () => ({
        currentFile: null,
        streamUrl: null,
        progressLoading: false,
        finishedLoading: false,
        alert: false,

        defectType: '',
        defectComments: '',
        defectImage:'',

        msg: '',
        stream: '',
        mainBranch: '',
        streamId: '2fc00dfe12',
        objId: '',
        token: 'ccf808246d50a0e24ae78343529e74ccb8a5ad73c9',
        viewer: null,
        selectObjId:'',
    }),
    watch: {},
    methods: {
        handleImage(e) {
            const selectedImage = e.target.files[0]; // get first file
            this.createBase64Image(selectedImage);
        },

        createBase64Image(fileObject) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.defectImage = e.target.result;
            };
            reader.readAsDataURL(fileObject);
        },

        selectFile(file) {
            this.currentFile = file;
            this.progressLoading = false
            this.finishedLoading = false
            this.alert = false;
        },

        upload() {
            if (this.currentFile.length === 0) {
                return;
            }
            // this.progressLoading = true;
            // this.alert = false;

            var reader = new FileReader();
            reader.onload = function(e) {
                this.defectImage = e.target.result
                console.log(this.defectImage)            
            };
            reader.onerror = function(error) {
                alert(error);
            };
            reader.readAsDataURL(this.currentFile)
        },

        async getResponse(){
            const path = 'http://localhost:5000/home';
            axios.get(path)
            .then ((res) => { 
                console.log(res.data);
                this.msg = res.data;
            }) 
            .catch ((err) => {
                console.error(err);
            });
        },

        setUpViewer() {
            // Handle selection events
            this.viewer.on("select", objects => {
            console.info(`Selection event. Current selection count: ${objects.length}.`)
            console.log(objects)
            })

            // Handle double click events
            this.viewer.on("object-doubleclicked", obj => {
            console.info("Object double click event.")
            console.log(obj ? obj : "nothing was doubleckicked.")
            })
        },

        async objUrl() {
            return 'https://speckle.xyz/streams/' + this.streamId + '/objects/' + this.objId;
        },

        async reload() {
            if (this.viewer === null) {
                this.viewer = new Viewer({
                container: document.getElementById('renderer'),
                showStats: false
                })
                await this.setUpViewer();
            }
            
            await this.fetchStreamData() // Fetch the stream data
            await this.reloadViewer() // Reload the viewer once the stream data has been fetched
        },

        async fetchStreamData() {
            await getStreamCommits(this.streamId, 1, null, this.token).then(str => {
                console.log(str)
                this.stream = str.data.stream

                // Split the branches into "main" and everything else
                this.mainBranch = this.stream.branches.items.find(b => b.name == "main")
                console.log("main branch", this.mainBranch)
            })
        },

        async reloadViewer() {
            await this.viewer.unloadAll()
            console.log('get main branch' + this.mainBranch)
            this.objId = this.mainBranch.commits.items[0].referencedObject;
            console.log(this.objUrl());
            await this.viewer.loadObject(
                await this.objUrl()
            )
            console.log(`Loaded latest commit from branch "${this.mainBranch.name}"`)

            this.viewer.interactions.zoomExtents(0.95, true)
        },

        addDefect() {
            const path = 'http://localhost:5000/home';
            const defectInfo = {
                img: this.defectImage,
                type: this.defectType,
                comments: this.defectComments,
                streamId: this.streamId,
                token: this.token,
            }

            this.defectImage = ''
            this.defectType = ''
            this.defectComments = ''

            axios.post(path, defectInfo)
            .then(() => {
                console.log('sent')
            })
            .catch((error) => {
                console.log(error);
            });
        },
    },

    computed: {},

    mounted() {
    },

    created(){
    },
};

</script>
