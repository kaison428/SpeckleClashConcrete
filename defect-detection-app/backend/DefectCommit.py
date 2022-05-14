from array import array
from hashlib import new
from logging import NullHandler
from types import AsyncGeneratorType
from typing import List
from specklepy.api import operations
from specklepy.api.client import SpeckleClient
from specklepy.api.credentials import get_default_account
from specklepy.api.resources import stream
from specklepy.transports.server import ServerTransport
from specklepy.objects.geometry import GEOMETRY, Box, Point
from specklepy.objects import Base
from numpy import ndarray

import requests
import json
import pandas as pd

from random import randint

class DefectObj(Base,speckle_type = "DefectObj"):

    defect_type: str = ''
    defect_img: str = ''
    comments: str = ''

class ConcreteDefects(Base,speckle_type = "ConcreteDefect",chunkable = {"defect_objs":1000}):

    defect_objs: List[DefectObj] = []
    comments: str = ''


def sendCommit(data):
    client = SpeckleClient(host = "https://speckle.xyz")

    client.authenticate_with_token(data['token'])

    stream_id = data['streamId']

    # Get the main branch with it's latest commit reference
    branch = client.branch.get(stream_id, "main", 1)
    # Get the id of the object referenced in the commit
    objHash = branch.commits.items[0].referencedObject


    # Create the server transport for the specified stream.
    transport = ServerTransport(client=client, stream_id=stream_id)

    # Receive the object
    received_base = operations.receive(obj_id=objHash, remote_transport=transport)

    # The received object, process it as you wish.
    print("Received object:", received_base)

    defects = ConcreteDefects()
    newDefect= DefectObj()
    newDefect.defect_type = data['type']
    newDefect.defect_img = data['img']
    newDefect.comments = data['img']
    defects.defect_objs.append(newDefect)

    if '@ConcreteDefects' in received_base:
        received_base['@ConcreteDefects'] = defects
    else:
        received_base['@ConcreteDefects']['defect_objs'].append(newDefect)

    transport = ServerTransport(client = client,stream_id = stream_id )

    hash = operations.send(base= received_base,transports= [transport])

    commit_id = client.commit.create(
        stream_id= stream_id,
        object_id=hash,
        message = "New Defect" + data['type']
    )

    print("Successfully created commit with id: ", commit_id)