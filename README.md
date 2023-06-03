<div align="center">
  <h1>SpeckleClashConcrete</h1>
  
  <p>
    Clash Detection & Defect Managment!
  </p>
</div>

# Overview

This project is built for the Speckle: Into the Speckleverse Hackathon. The goal of this project is to leverage the platform and technology Speckle offers to improve the workflow of professionals in the AEC industry, such as BIM modellers and inspectors.

![image](https://github.com/kaison428/SpeckleClashConcrete/assets/38864087/58a14d86-ae83-4e1f-80d3-941f97edc300)

## :star2: About this hack 
The concrete defect management app allows users to add defect objects to the selected structural elements. Each defect object includes the defect type, comments, and an image of the defect. A new commit with the added defect objects will be sent to the existing stream. The dashboard shows all the relevant project information, including clash findings, action plan, and defects. It also visualizes the new updates and changes made to the model, which will help contractors and engineers to keep track of the progress.

## :bulb: Inspiration
Transitioning from conventional CAD / Paper drawing to BIM in recent years is quite tough especially for an old industry which finds the conventional method is still acceptable. In 2018 Indonesia’s Ministry of General Works was mandated to operate with BIM for labor-intensive, highly-invested, and technology-intensive projects. To escalate the use of BIM for coordination especially for clash detection, we would like to bridge the transition using an intuitive and user friendly interface that allows staff who are proficient in 2D drawing to be able to coordinate in both 3D and 2D. On the other hand, the demand for structural inspection and assessment activities are continuing to increase in recent decades, especially in cities with aging and deteriorating buildings like Hong Kong. And to efficiently conduct a large number of inspections, better data management for structural defects and damages is necessary.

## 🏗️: Built with
It was built using Vue.js, Flask, Streamlit, Speckle Viewer, and SpecklePy. The frontend was modified and enhanced based on the PointCloud application from Speckle. The dashboard was built based on the streamlit dashboard tutorial by Mucahit Bilal GOKER. SpecklyPy was used to send commits with the updated objects to the server.
