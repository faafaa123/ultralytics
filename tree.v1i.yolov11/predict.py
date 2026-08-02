from ultralytics import YOLO

def main():

    # Trainierte Gewichte laden
    model = YOLO("best.pt")

    results = model("tree.jpg", conf=0.04)

    results[0].show()

if __name__ == "__main__":
    main()