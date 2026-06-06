from ultralytics import YOLO

def main():

    # Trainierte Gewichte laden
    model = YOLO("window_detector.pt")

    results = model("house2.jpg")

    results[0].show()

if __name__ == "__main__":
    main()