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
#-------------------cd -------

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
    st.title("Clash Detection Dashboard")
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
    clashFindingCol, actionPlanCol= st.columns(2)

    height = 400
    with clashFindingCol:
        st.subheader("Clash Findings")
        clashFindText = st.text_area('Input your findings', 'Hi there!', height=height)

    with actionPlanCol:
        st.subheader("Action Plan")
        actionPlanText = st.text_area('Input your action plan', 'Hi there!', height=height)

    #-------
    # Columns for Cards
    branchCol, commitCol, connectorCol, contributorCol = st.columns(4)
    #-------

    #-------
    #Branch Card 💳
    branchCol.metric(label = "Number of branches", value= stream.branches.totalCount)
    #branch names as markdown list
    branchNames = [b.name for b in branches]
    listToMarkdown(branchNames, branchCol)
    #-------

    #-------
    #Commit Card 💳
    commitCol.metric(label = "Number of commits", value= len(commits))
    #-------

    #-------
    #Connector Card 💳
    #connector list
    connectorList = [c.sourceApplication for c in commits]
    #number of connectors
    connectorCol.metric(label="Number of connectors", value= len(dict.fromkeys(connectorList)))
    #get connector names
    connectorNames = list(dict.fromkeys(connectorList))
    #convert it to markdown list
    listToMarkdown(connectorNames, connectorCol)
    #-------

    #-------
    #Contributor Card 💳
    contributorCol.metric(label = "Number of contributors", value= len(stream.collaborators))
    #unique contributor names
    contributorNames = list(dict.fromkeys([col.name for col in stream.collaborators]))
    #convert it to markdown list
    listToMarkdown(contributorNames,contributorCol)
    #-------

#--------------------------

#--------------------------
with graphs:
    st.subheader("Graphs")
    #COLUMNS FOR CHARTS
    branch_graph_col, connector_graph_col, collaborator_graph_col = st.columns([2,1,1])
    
    #-------
    #BRANCH GRAPH 📊
    #branch count dataframe
    branch_counts = pd.DataFrame([[branch.name, branch.commits.totalCount] for branch in branches])
    #rename dataframe columns
    branch_counts.columns = ["branchName", "totalCommits"]
    #create graph
    branch_count_graph = px.bar(branch_counts, x=branch_counts.branchName, y=branch_counts.totalCommits, color=branch_counts.branchName, labels={"branchName":"","totalCommits":""})
    #update layout
    branch_count_graph.update_layout(
        showlegend = False,
        margin = dict(l=1,r=1,t=1,b=1),
        height=220)
    #show graph
    branch_graph_col.plotly_chart(branch_count_graph, use_container_width=True)
    #-------

    #-------
    #CONNECTOR CHART 🍩
    commits= pd.DataFrame.from_dict([c.dict() for c in commits])
    #get apps from commits
    apps = commits["sourceApplication"]
    #reset index
    apps = apps.value_counts().reset_index()
    #rename columns
    apps.columns=["app","count"]
    #donut chart
    fig = px.pie(apps, names=apps["app"],values=apps["count"], hole=0.5)
    #set dimensions of the chart
    fig.update_layout(
        showlegend=False,
        margin=dict(l=1, r=1, t=1, b=1),
        height=200,
        yaxis_scaleanchor="x"
        )
    #set width of the chart so it uses column width
    connector_graph_col.plotly_chart(fig, use_container_width=True)
    #-------

    #-------
    #COLLABORATOR CHART 🍩
    #get authors from commits
    authors = commits["authorName"].value_counts().reset_index()
    #rename columns
    authors.columns=["author","count"]
    #create our chart
    authorFig = px.pie(authors, names=authors["author"], values=authors["count"],hole=0.5)
    authorFig.update_layout(
        showlegend=False,
        margin=dict(l=1,r=1,t=1,b=1),
        height=200,
        yaxis_scaleanchor="x",)
    collaborator_graph_col.plotly_chart(authorFig, use_container_width=True)   
    #-------
    
    #-------
    #COMMIT PANDAS TABLE 🔲
    st.subheader("Commit Activity Timeline 🕒")
    #created at parameter to dataframe with counts
    cdate = pd.to_datetime(commits["createdAt"]).dt.date.value_counts().reset_index().sort_values("index")
    #date range to fill null dates.
    null_days = pd.date_range(start=cdate["index"].min(), end=cdate["index"].max())
    #add null days to table
    cdate = cdate.set_index("index").reindex(null_days, fill_value=0)
    #reset index
    cdate = cdate.reset_index()
    #rename columns
    cdate.columns = ["date", "count"]
    #redate indexed dates
    cdate["date"] = pd.to_datetime(cdate["date"]).dt.date
    #-------

    #-------
    #COMMIT ACTIVITY LINE CHART📈
    #line chart
    fig = px.line(cdate, x=cdate["date"], y=cdate["count"], markers =True)
    #recolor line
    
    #Show Chart
    st.plotly_chart(fig, use_container_width=True)
    #-------

#--------------------------