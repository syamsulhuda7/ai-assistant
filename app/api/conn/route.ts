export async function GET() {
  try {
    return Response.json({
      success: true,
      message: "API connection successful",
      status: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "API connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
      },
      {
        status: 500,
      },
    );
  }
}
