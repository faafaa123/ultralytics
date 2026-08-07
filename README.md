<a name="readme-top"></a>

<br />
<div align="center">
  <a href="https://roboflow.com/">
    <img src="robo-logo.svg" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center"><a href="https://roboflow.com/">Roboflow.com</a> Computer Vision</h3>

  <p align="center">
    mein Repository zum Trainieren und Testen von AI-Modellen<br>
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

### ./facade-detector ~ Erkennung von Fenster und Türen aus der Frontalperspektive ( old )
Source: <a href="https://universe.roboflow.com/facade-elements/facade-elements-for-yolov8">facade-elements-for-yolov8 Computer Vision Model</a><br><br>

### ./tree-detector ~ Erkennung von Bäumen aus der Vogelperspektive ( bitte dieses hier trainieren, siehe TODO weiter unten )
Source: <a href="https://universe.roboflow.com/detectiontest-1pfas/tree-3prlq">tree Computer Vision Dataset</a><br><br>

### ./web-testing ~ Ausführen der web-kompatiblen Konvertierungen der trainierten Modelle ( onnxruntime-web )

<br>

# TODO

### Wie du siehst passen die vom KI-Modell ausgewählten Baumpositionen bereits gut. Allerdings stammen sie aus einem schwach trainierten Modell und somit müssen wir mit einer Konfidenz von 2% arbeiten, was nicht wirklich gut ist.<br>

<div align="center"> <a href="https://github.com/faafaa123/ultralytics"> <img src="demo-notes.png" alt="Logo" > </a> <br>

</div>

<br>

### Ich habe dir eine für deinen MSI-EdgeXpert vorkonfigurierte Trainingsdatei in den ./tree-detector Ordner gelegt ( train-edgeX.py ).
### Du kannst sie gerne optimieren.

<br>

### Nach einen erfolgreichen Training bitte einfach auf das Repository pushen..
