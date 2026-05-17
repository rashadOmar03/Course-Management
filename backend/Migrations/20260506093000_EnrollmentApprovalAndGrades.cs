using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourseManagement.Migrations
{
    /// <inheritdoc />
    public partial class EnrollmentApprovalAndGrades : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add IsApproved (default false). Existing rows are real enrollments,
            // so we mark them approved right after adding the column.
            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "Enrollments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Grade",
                table: "Enrollments",
                type: "nvarchar(5)",
                maxLength: 5,
                nullable: true);

            // Treat any pre-existing enrollment rows as already approved
            migrationBuilder.Sql("UPDATE [Enrollments] SET [IsApproved] = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "Grade",
                table: "Enrollments");
        }
    }
}
