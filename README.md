<a name="readme-top"></a>

<br />
<div align="center">
  <a href="https://roboflow.com/">
    <img src="robo-logo.svg" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center"><a href="https://roboflow.com/">Roboflow.com</a> Computer Vision</h3>

  <p align="center">
    ein Repository zum trainieren und testen von AI-Modellen<br>
    ~ die bekannten YOLO-Modelle
    <br />
    <br />
    ·
      <a href="https://github.com/faafaa123/ultralytics/issues">Request Feature</a>
    ·
      <a href="https://github.com/faafaa123/ultralytics/issues">Report Bug</a>
  </p>
</div>

<br />
<br />

## Ordnerstruktur

### ./facade-detector ~ Erkennung von Fenster und Türen ( old )
Source: <a href="https://universe.roboflow.com/facade-elements/facade-elements-for-yolov8">facade-elements-for-yolov8 Computer Vision Model</a><br><br>

### ./tree-detector ~ Erkennung von Bäumen ( bitte dieses hier trainieren )
Source: <a href="https://universe.roboflow.com/detectiontest-1pfas/tree-3prlq">tree Computer Vision Dataset</a><br><br>

### ./web-testing ~ Ausführen der web-kompatiblen Konvertierungen der trainierten Modelle ( onnxruntime-web )

<!-- <div align="center"> <a href="https://github.com/faafaa123/Skimpex-App"> <img src="./demo-tree-detector.JPG" alt="Logo" > </a> </div> -->

<br>

As you can see the positions of the trees selected by the ai-model does already fit well. But we have to take a detection with confidence lower than 4%, which isn't really right.<br><br>
