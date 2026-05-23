package com.security.Ace.Front.Line.Security.Solutions.controller;
import com.security.Ace.Front.Line.Security.Solutions.entity.AreaManager;
import com.security.Ace.Front.Line.Security.Solutions.repository.AreaManagerRepository;
//import lk.acefrontline.model.AreaManager;
//import lk.acefrontline.repository.AreaManagerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private AreaManagerRepository areaManagerRepository;

    // For demo purposes, using manager ID 1. In production, use session/authentication
    private static final Long DEMO_MANAGER_ID = 1L;

    @GetMapping
    public String dashboard(Model model) {
        AreaManager manager = areaManagerRepository.findById(DEMO_MANAGER_ID)
                .orElse(null);
        model.addAttribute("manager", manager);
        return "dashboard";
    }

    @GetMapping("/weekly-report")
    public String weeklyReport(Model model) {
        AreaManager manager = areaManagerRepository.findById(DEMO_MANAGER_ID)
                .orElse(null);
        model.addAttribute("manager", manager);
        return "weekly-report";
    }

    @GetMapping("/monthly-report")
    public String monthlyReport(Model model) {
        AreaManager manager = areaManagerRepository.findById(DEMO_MANAGER_ID)
                .orElse(null);
        model.addAttribute("manager", manager);
        return "monthly-report";
    }

    @GetMapping("/attendance")
    public String attendance(Model model) {
        AreaManager manager = areaManagerRepository.findById(DEMO_MANAGER_ID)
                .orElse(null);
        model.addAttribute("manager", manager);
        return "attendance";
    }

    @GetMapping("/leave-management")
    public String leaveManagement(Model model) {
        AreaManager manager = areaManagerRepository.findById(DEMO_MANAGER_ID)
                .orElse(null);
        model.addAttribute("manager", manager);
        return "leave-management";
    }
}

