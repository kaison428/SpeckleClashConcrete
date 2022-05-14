# Credit to Mucahit Bilal GOKER

#--------------------------
#IMPORT LIBRARIES
#import streamlit
import streamlit as st
#specklepy libraries
from specklepy.api.client import SpeckleClient
from specklepy.api.credentials import get_default_account
#import pandas
import pandas as pd
#import plotly express
import plotly.express as px
from datetime import date

from specklepy.transports.server import ServerTransport
from specklepy.api import operations
#---------------------------

#--------------------------
#PAGE CONFIG
st.set_page_config(
    page_title="Clash Detection Dashboard",
    page_icon="📑",
    layout="wide",
)
#--------------------------

#--------------------------
#CONTAINERS
header = st.container()
input = st.container()
projectDetailsFirstRow = st.container()
projectDetailsSecondRow = st.container()
viewer = st.container()
report = st.container()
graphs = st.container()
#--------------------------

#--------------------------
#HEADER
#Page Header
with header:
    st.title("Clash Detection and Defect Dashboard")
#--------------------------

#--------------------------
#INPUTS
with input:
    st.subheader("Inputs")

    #-------
    #CLIENT
    client = SpeckleClient(host="https://speckle.xyz")
    #Get account from Token
    account = get_default_account()
    #Authenticate
    client.authenticate_with_account(account)
    #-------
    streamCol, initialCommitCol, finalCommitCol = st.columns(3)
    #-------
    #Streams List👇
    streams = client.stream.list()
    #Get Stream Names
    streamNames = [s.name for s in streams]
    #Dropdown for stream selection
    sName = streamCol.selectbox(label="Select your stream", options=streamNames, help="Select your stream from the dropdown")
    #SELECTED STREAM ✅
    stream = client.stream.search(sName)[0]
    #Stream Branches 🌴
    branches = client.branch.list(stream.id)

    #Stream Commits 🏹
    commits = client.commit.list(stream.id, limit=100)
    commitMessages= {c.message:c for c in commits}
    cNameInitial = initialCommitCol.selectbox(label="Select your initial model", options=commitMessages)
    cNameFinal = finalCommitCol.selectbox(label="Select your final model", options=commitMessages)
    initialCommit = commitMessages[cNameInitial]
    finalCommit = commitMessages[cNameFinal]

    # # reference base object
    # objHash = finalCommit.referencedObject

    # # Create the server transport for the specified stream.
    # transport = ServerTransport(client=client, stream_id=stream.id)

    # # Receive the object
    # received_base = operations.receive(obj_id=objHash, remote_transport=transport)

    # # The received object, process it as you wish.
    # print("Received object:", received_base)

    # # TODO: Perform some operation on the received data
    # member_names = received_base.get_member_names()
    # print(member_names)

    #-------
#--------------------------

#--------------------------
#DEFINITIONS
#create a definition to convert your list to markdown
def listToMarkdown(list, column):
    list = ["- " + i + " \n" for i in list]
    list = "".join(list)
    return column.markdown(list)

#create a definition that creates iframe from commit id
def commit2viewer(stream, commit, height=400) -> str:
    embed_src = "https://speckle.xyz/embed?stream="+stream.id+"&commit="+commit.id
    return st.components.v1.iframe(src=embed_src, height=height)
#--------------------------

#--------------------------
#PROJECT DETAILS
with projectDetailsFirstRow:
    st.subheader('Report')

    # columns for cards
    areaCol, locationCol, dateCol, revitModelNameCol = st.columns([1,1,1,3])
    area = areaCol.text_input("Area (Level & Zone)", "N/A")
    location = locationCol.text_input("Grid / Location", "N/A")
    projectDate = dateCol.text_input("Date", date.today())
    revitModelName = revitModelNameCol.text_input("Revit Model Name")

#PROJECT DETAILS
with projectDetailsSecondRow:
    # columns for cards
    descriptionCol, statusCol = st.columns([3,1])
    description = descriptionCol.text_input("Description", "About this project")

    status_options = ['Open', 'For Approval', 'Approved', 'Closed']
    status = statusCol.selectbox(label="Status", options=status_options, help="Update Status")

#--------------------------
#VIEWER👁‍🗨
with viewer:
    #-------
    # Columns for Cards
    firstPlanCol, secondPlanCol= st.columns(2)

    with firstPlanCol:
        commit2viewer(stream, initialCommit)
        
    with secondPlanCol:
        commit2viewer(stream, finalCommit)
#--------------------------

#--------------------------
#REPORT
with report:
    # Columns for Cards
    clashFindingCol, actionPlanCol, defectCol= st.columns(3)

    height = 400
    with clashFindingCol:
        st.subheader("Clash Findings")
        clashFindText = st.text_area('Input your findings', 'Hi there!', height=height)

    with actionPlanCol:
        st.subheader("Action Plan")
        actionPlanText = st.text_area('Input your action plan', 'Hi there!', height=height)

    with defectCol:
        st.subheader("Defects")

        defectType = st.text_area('show defects', 'Hi there!', height=height)
