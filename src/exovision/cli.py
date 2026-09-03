from __future__ import annotations
import argparse
from pathlib import Path
from exovision.pipeline import train_model

def main():
    parser = argparse.ArgumentParser(description="Train Exovision's five-class candidate classifier")
    parser.add_argument("train", nargs="?", default="train")
    parser.add_argument("--output", default="artifacts/exovision-model.joblib")
    parser.add_argument("--samples-per-class", type=int, default=450)
    args = parser.parse_args()
    print(train_model(Path(args.output), args.samples_per_class))

if __name__ == "__main__": main()
