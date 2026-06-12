using BE_API.Authorization;
using BE_API.Dto.Common;
using BE_API.Dto.Role;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BE_API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = Policies.AdminOnly)]
public class RoleController(IRoleService roleService) : ControllerBase
{
    private const string ROLE_LIST_SUCCESS = "Lấy danh sách role thành công";
    private const string ROLE_GET_SUCCESS = "Lấy role thành công";
    private const string ROLE_CREATE_SUCCESS = "Tạo role thành công";
    private const string ROLE_UPDATE_SUCCESS = "Cập nhật role thành công";
    private const string ROLE_DELETE_SUCCESS = "Xóa role thành công";

    [HttpGet("[action]")]
    [SwaggerOperation(Summary = "Lấy danh sách role")]
    public async Task<IActionResult> GetAll()
    {
        var data = await roleService.GetRolesAsync();
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = ROLE_LIST_SUCCESS
        });
    }

    [HttpGet("[action]/{id}")]
    [SwaggerOperation(Summary = "Lấy role theo id")]
    public async Task<IActionResult> Get(int id)
    {
        var data = await roleService.GetRoleByIdAsync(id);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = ROLE_GET_SUCCESS
        });
    }

    [HttpPost("[action]")]
    [SwaggerOperation(Summary = "Tạo role")]
    public async Task<IActionResult> Create([FromBody] RoleCreateDto dto)
    {
        var data = await roleService.CreateRoleAsync(dto);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = ROLE_CREATE_SUCCESS
        });
    }

    [HttpPut("[action]/{id}")]
    [SwaggerOperation(Summary = "Cập nhật role")]
    public async Task<IActionResult> Update(int id, [FromBody] RoleUpdateDto dto)
    {
        var data = await roleService.UpdateRoleAsync(id, dto);
        return Ok(new ResponseDto
        {
            Success = true,
            Data = data,
            Message = ROLE_UPDATE_SUCCESS
        });
    }

    [HttpDelete("[action]/{id}")]
    [SwaggerOperation(Summary = "Xóa role")]
    public async Task<IActionResult> Delete(int id)
    {
        await roleService.DeleteRoleAsync(id);
        return Ok(new ResponseDto
        {
            Success = true,
            Message = ROLE_DELETE_SUCCESS
        });
    }
}
