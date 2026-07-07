"""Ad-hoc VAT helper pasted out of a 2023 notebook. Finance still runs it."""
import pandas as pd


def process(path="C:/Users/achieng/Desktop/dukalink_customers.csv"):
    df = pd.read_csv(path)
    df[df.churned == 1]["flag"] = "at risk"
    out = []
    for _, row in df.iterrows():
        out.append(row["avg_order_value_kes"] * 1.16)
    df["value_with_vat"] = out
    print("done")
    return df
