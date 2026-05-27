export default async function handler(req: any, res: any) {
  try {
    const response = await fetch('https://wttr.in/Medan?format=j1');
    const data = await response.json();
    
    const current = data.current_condition[0];
    const temp = current.temp_C;
    const condition = current.weatherDesc[0].value;
    
    // Mapping icon sederhana
    let icon = "Sun";
    const condLower = condition.toLowerCase();
    if (condLower.includes("rain") || condLower.includes("drizzle")) icon = "CloudRain";
    else if (condLower.includes("cloud") || condLower.includes("overcast")) icon = "Cloud";
    else if (condLower.includes("thunder") || condLower.includes("storm")) icon = "CloudLightning";
    else if (condLower.includes("snow")) icon = "Snowflake";
    else if (condLower.includes("mist") || condLower.includes("fog")) icon = "CloudFog";

    res.status(200).json({
      temp: parseInt(temp),
      city: "Medan",
      condition: condition,
      icon: icon
    });
  } catch (error) {
    console.error("Weather API Error:", error);
    res.status(200).json({
      temp: 28,
      city: "Medan",
      condition: "Sunny",
      icon: "Sun"
    });
  }
}
